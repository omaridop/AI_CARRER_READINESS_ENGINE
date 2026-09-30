import { CourseLink, searchCourseWeb } from '../ai/course-search';

export interface CourseSearchResult {
  skill: string;
  source: 'web' | 'fallback';
  researchedAt: string | null;
  cached: boolean;
  courses: CourseLink[];
  searchLinks: { provider: 'Coursera' | 'Udemy'; url: string }[];
  notice: string;
}

export function courseSearchFallback(skill: string, notice: string): CourseSearchResult {
  return { skill, source: 'fallback', researchedAt: null, cached: false, courses: [], notice,
    searchLinks: [
      { provider: 'Coursera', url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}` },
      { provider: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}` },
    ],
  };
}

/** Local demo cache: bounded to taxonomy skills; deduplicates in-flight requests. */
export class CourseSearchService {
  private cache = new Map<string, { until: number; result: CourseSearchResult }>();
  private pending = new Map<string, Promise<CourseSearchResult>>();
  constructor(private search = searchCourseWeb, private now = Date.now) {}

  async find(skill: string, aliases: string[] = []): Promise<CourseSearchResult> {
    const cached = this.cache.get(skill);
    if (cached && cached.until > this.now()) return { ...cached.result, cached: true };
    const pending = this.pending.get(skill);
    if (pending) return pending;
    if (this.pending.size >= 2) return courseSearchFallback(skill, 'Course research is busy. Try again shortly, or browse the providers directly.');
    const work = this.research(skill, aliases);
    this.pending.set(skill, work);
    try { return await work; } finally { this.pending.delete(skill); }
  }

  private async research(skill: string, aliases: string[]): Promise<CourseSearchResult> {
    let result: CourseSearchResult;
    try {
      const courses = await this.search(skill, aliases);
      result = courses.length ? {
        ...courseSearchFallback(skill, ''), source: 'web', researchedAt: new Date(this.now()).toISOString(), courses,
        notice: 'A shortlist from web search, ordered by topic match—not an exhaustive quality ranking. Check the syllabus, prerequisites, language and current price on the provider’s page.',
      } : courseSearchFallback(skill, 'No suitable course pages were returned with search citations. Browse the providers directly.');
    } catch (error: unknown) {
      const code = error instanceof Error && /^(search_not_configured|search_http_\d{3})$/.test(error.message) ? error.message : 'search_unavailable';
      console.warn(`[course-search] ${code}; using provider search links`);
      result = courseSearchFallback(skill, 'Live course research is unavailable right now. These are provider search links, not researched recommendations.');
    }
    this.cache.set(skill, { result, until: this.now() + (result.source === 'web' ? 3_600_000 : 60_000) });
    return result;
  }
}
