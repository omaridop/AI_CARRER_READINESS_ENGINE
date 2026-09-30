import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';

interface Course {
  title: string;
  url: string;
  provider: 'Coursera' | 'Udemy';
  whyRelevant: string;
  sourceExcerpt: string | null;
}
interface CourseResults {
  skill: string;
  source: 'web' | 'fallback';
  researchedAt: string | null;
  cached: boolean;
  courses: Course[];
  searchLinks: { provider: 'Coursera' | 'Udemy'; url: string }[];
  notice: string;
}
type SearchState = { status: 'idle' | 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: CourseResults };

function safeProviderLink(url: unknown, provider: unknown): boolean {
  if (typeof url !== 'string' || (provider !== 'Coursera' && provider !== 'Udemy')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.port
      && parsed.hostname === (provider === 'Coursera' ? 'www.coursera.org' : 'www.udemy.com');
  } catch { return false; }
}

function validResults(value: CourseResults | null, skill: string): value is CourseResults {
  return !!value && value.skill === skill && ['web', 'fallback'].includes(value.source)
    && typeof value.notice === 'string' && typeof value.cached === 'boolean'
    && (value.researchedAt === null || (typeof value.researchedAt === 'string' && Number.isFinite(Date.parse(value.researchedAt))))
    && Array.isArray(value.courses) && value.courses.every(c => c && typeof c.title === 'string'
      && typeof c.whyRelevant === 'string' && (c.sourceExcerpt === null || typeof c.sourceExcerpt === 'string') && safeProviderLink(c.url, c.provider))
    && Array.isArray(value.searchLinks) && value.searchLinks.every(l => l && safeProviderLink(l.url, l.provider))
    && (value.source === 'web' ? value.researchedAt !== null && value.courses.length > 0 && value.courses.length <= 3
      : value.researchedAt === null && value.courses.length === 0);
}

/** Remount for a different skill so pending results cannot cross skill boundaries. */
export function CourseRecommendations({ skill }: { skill: string }) {
  return <CourseSearch key={skill} skill={skill} />;
}

function CourseSearch({ skill }: { skill: string }) {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);

  const search = async () => {
    if (request.current) return;
    const id = ++sequence.current;
    const controller = new AbortController();
    request.current = controller;
    setState({ status: 'loading' });
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const result = await apiFetch<CourseResults>('/courses/search', {
        method: 'POST', body: JSON.stringify({ skillName: skill }), signal: controller.signal,
      });
      if (id !== sequence.current) return;
      if (result.error) setState({ status: 'error', message: controller.signal.aborted ? 'Course research took too long. Please try again.' : result.error });
      else if (!validResults(result.data, skill)) setState({ status: 'error', message: 'We couldn’t read these course results. Please try again.' });
      else setState({ status: 'ready', data: result.data });
    } finally {
      clearTimeout(timer);
      if (id === sequence.current) request.current = null;
    }
  };

  return <section className="panel course-section" aria-labelledby="courses-heading" aria-busy={state.status === 'loading'}>
    <div className="section-heading"><div><p className="eyebrow">TAKE THE NEXT STEP</p><h3 id="courses-heading">Courses for {skill}</h3><p>Find a structured course to put this skill into practice.</p></div>
      <button className="primary-button" onClick={search} disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Researching courses…' : state.status === 'idle' ? 'Find courses' : 'Check course results'}</button>
    </div>
    {state.status === 'idle' && <p className="course-hint">Search Coursera and Udemy for relevant course pages. Research starts only when you ask and may take up to 25 seconds.</p>}
    {state.status === 'loading' && <p role="status" className="course-hint">Searching course sources for {skill}. You can keep reading your lesson while we look.</p>}
    {state.status === 'error' && <p role="alert" className="course-error">{state.message}</p>}
    {state.status === 'ready' && <>
      <div className="course-provenance"><span className="status-badge">{state.data.source === 'web' ? state.data.cached ? 'Saved web research' : 'Found through web research' : 'Provider search links · fallback'}</span>
        {state.data.researchedAt && <span>Researched {new Date(state.data.researchedAt).toLocaleString()}</span>}
      </div>
      <p className="course-hint">{state.data.notice}</p>
      <div className="course-grid">{state.data.courses.map(course => <article className="course-card" key={course.url}>
        <p className="eyebrow">{course.provider}</p><h4>{course.title}</h4><p>{course.whyRelevant}</p>
        {course.sourceExcerpt && <details><summary>What the search source says</summary><p>{course.sourceExcerpt}</p></details>}
        <a className="text-button" href={course.url} target="_blank" rel="noopener noreferrer">View course on {course.provider}<span aria-hidden="true">↗</span></a>
      </article>)}</div>
      {state.data.courses.length === 0 && <p className="course-hint">No researched course recommendations to show yet.</p>}
      <div className="course-browse"><span>Explore more:</span>{state.data.searchLinks.map(link => <a key={link.provider} href={link.url} target="_blank" rel="noopener noreferrer">Search {link.provider} ↗</a>)}</div>
      <p className="course-disclaimer">Links open the provider in a new tab. We haven’t verified course quality, availability or pricing; review the syllabus and recent reviews before enrolling. Taking a course does not automatically change your requirement-match score.</p>
    </>}
  </section>;
}
