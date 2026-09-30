import { useState, useEffect, useCallback } from 'react';
import { useWizard } from '../context/WizardContext';
import { useApi } from '../hooks/useApi';

/** A single skill extracted from a posting. */
interface PostingSkill {
  id: number;
  name: string;
  category: string;
}

/** Match result for a single job posting. */
interface PostingMatch {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  source_label: 'real' | 'sample';
  source_name: string;
  date_posted: string | null;
  totalSkills: number;
  matchedSkills: PostingSkill[];
  missingSkills: PostingSkill[];
  matchPercent: number;
}

/**
 * Step 4 — Job Match
 *
 * After the student selects skills and evidence, this screen shows all
 * available job postings and how well the student matches each one.
 * Clicking a job expands a detail view showing matched vs missing skills.
 */
export const JobMatch = () => {
  const { skills, setStep, targetJobTitle, magicModeData } = useWizard();
  const { execute, isLoading } = useApi<{ matches: PostingMatch[] }>();
  const [matches, setMatches] = useState<PostingMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<PostingMatch | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    const skillNames = skills.map(s => s.name);
    if (skillNames.length === 0) {
      setError('No skills selected. Go back and add your skills first.');
      return;
    }

    // MAGIC MODE MATCHING (VIRTUAL)
    if (targetJobTitle !== 'Junior Data Analyst') {
      if (magicModeData && magicModeData.topJobs) {
        const dynamicSkills = (magicModeData.dynamicSkills || []).map((s: any) => s.skill || s);
        const userSkillNames = skillNames.map(name => name.toLowerCase());
        
        const virtualMatches: PostingMatch[] = magicModeData.topJobs.map((job: any, index: number) => {
          const desc = (job.description || '').toLowerCase();
          
          let jobRequiredSkills = dynamicSkills.filter((skillName: string) => 
            desc.includes(skillName.toLowerCase())
          ).map((name: string, i: number) => ({ id: i, name, category: 'dynamic' }));
          
          if (jobRequiredSkills.length === 0) {
             jobRequiredSkills = dynamicSkills.slice(0, 5).map((name: string, i: number) => ({ id: i, name, category: 'dynamic' }));
          }

          const matched: PostingSkill[] = [];
          const missing: PostingSkill[] = [];
          
          jobRequiredSkills.forEach((reqSkill: PostingSkill) => {
            if (userSkillNames.includes(reqSkill.name.toLowerCase())) {
              matched.push(reqSkill);
            } else {
              missing.push(reqSkill);
            }
          });
          
          const total = matched.length + missing.length;
          const matchPercent = total === 0 ? 0 : Math.round((matched.length / total) * 100);

          return {
            id: 1000 + index,
            title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            location: job.location || 'Unknown Location',
            source_label: 'real' as const,
            source_name: job.source || 'web',
            date_posted: job.date || null,
            totalSkills: total,
            matchedSkills: matched,
            missingSkills: missing,
            matchPercent
          };
        });
        
        virtualMatches.sort((a, b) => b.matchPercent - a.matchPercent);
        setMatches(virtualMatches);
      }
      return;
    }

    // STATIC DATABASE MATCHING
    const result = await execute('/postings/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillNames }),
    });

    if (result.data?.matches) {
      setMatches(result.data.matches);
    } else if (result.error) {
      setError(result.error);
    }
  }, [skills, execute, targetJobTitle, magicModeData]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Get unique sources for filter
  const sources = Array.from(new Set(matches.map(m => m.source_name))).sort();
  const filtered = filterSource === 'all'
    ? matches
    : matches.filter(m => m.source_name === filterSource);

  // ── Detail view ────────────────────────────────────────
  if (selectedJob) {
    return (
      <div className="job-match-workspace">
        <button className="text-button back-link" onClick={() => setSelectedJob(null)}>
          ← Back to all jobs
        </button>

        <div className="section-heading">
          <div>
            <p className="eyebrow">JOB SKILL BREAKDOWN</p>
            <h2>{selectedJob.title}</h2>
            <p className="muted">
              {selectedJob.company || 'Company not listed'} · {selectedJob.location || 'Jordan'} · {selectedJob.source_name}
              {selectedJob.source_label === 'sample' && <span className="source-badge sample">Sample</span>}
              {selectedJob.source_label === 'real' && <span className="source-badge real">Real</span>}
            </p>
          </div>
          <div className="match-score-big">
            <span className="text-4xl">{selectedJob.matchPercent}%</span>
            <span className="muted">match</span>
          </div>
        </div>

        <div className="match-track" role="progressbar" aria-valuenow={selectedJob.matchPercent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${selectedJob.matchPercent}%` }} />
        </div>

        <div className="skill-columns">
          <section className="panel skill-column matched">
            <h3>
              <span className="skill-icon" aria-hidden="true">✓</span>
              Skills You Have ({selectedJob.matchedSkills.length})
            </h3>
            {selectedJob.matchedSkills.length === 0 ? (
              <p className="muted">None of your skills match this job's requirements.</p>
            ) : (
              <ul className="skill-list">
                {selectedJob.matchedSkills.map(s => (
                  <li key={s.id} className="skill-tag matched">
                    <span className="skill-check" aria-hidden="true">✓</span>
                    {s.name}
                    <span className="skill-category">{s.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel skill-column missing">
            <h3>
              <span className="skill-icon" aria-hidden="true">✗</span>
              Skills You Need ({selectedJob.missingSkills.length})
            </h3>
            {selectedJob.missingSkills.length === 0 ? (
              <p className="empty-success">You have all the skills this job asks for!</p>
            ) : (
              <ul className="skill-list">
                {selectedJob.missingSkills.map(s => (
                  <li key={s.id} className="skill-tag missing">
                    <span className="skill-x" aria-hidden="true">✗</span>
                    {s.name}
                    <span className="skill-category">{s.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="job-detail-actions">
          <button className="secondary-button" onClick={() => setSelectedJob(null)}>
            ← Back to All Jobs
          </button>
          <button className="primary-button" onClick={() => setStep(5)}>
            Continue to Analysis →
          </button>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────
  return (
    <div className="job-match-workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EXPLORE YOUR OPTIONS</p>
          <h2>Job Match Explorer</h2>
          <p>See how your {skills.length} selected skill{skills.length !== 1 ? 's' : ''} match against real job postings in Jordan.</p>
        </div>
        <span className="count-badge">{filtered.length} jobs</span>
      </div>

      {error && (
        <div className="panel state-panel error-panel">
          <p>{error}</p>
          <button className="primary-button" onClick={() => setStep(3)}>Go Back to Evidence</button>
        </div>
      )}

      {isLoading && (
        <div className="panel state-panel">
          <p className="loading-text">Matching your skills against {matches.length || '…'} job postings…</p>
        </div>
      )}

      {!isLoading && !error && matches.length > 0 && (
        <>
          {/* Source filter */}
          {sources.length > 1 && (
            <div className="filter-bar">
              <span className="muted">Filter by source:</span>
              <button
                className={`filter-chip ${filterSource === 'all' ? 'active' : ''}`}
                onClick={() => setFilterSource('all')}
              >
                All ({matches.length})
              </button>
              {sources.map(src => (
                <button
                  key={src}
                  className={`filter-chip ${filterSource === src ? 'active' : ''}`}
                  onClick={() => setFilterSource(src)}
                >
                  {src} ({matches.filter(m => m.source_name === src).length})
                </button>
              ))}
            </div>
          )}

          {/* Job cards */}
          <div className="job-cards">
            {filtered.map(job => (
              <article
                key={job.id}
                className="job-card panel"
                onClick={() => setSelectedJob(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedJob(job); }}
                aria-label={`${job.title} — ${job.matchPercent}% match`}
              >
                <div className="job-card-header">
                  <div>
                    <h3>{job.title}</h3>
                    <p className="muted">
                      {job.company || 'Company not listed'} · {job.location || 'Jordan'}
                    </p>
                  </div>
                  <div className={`match-badge ${job.matchPercent >= 70 ? 'high' : job.matchPercent >= 40 ? 'medium' : 'low'}`}>
                    {job.matchPercent}%
                  </div>
                </div>

                <div className="job-card-track">
                  <span style={{ width: `${job.matchPercent}%` }} />
                </div>

                <div className="job-card-meta">
                  <span>{job.matchedSkills.length}/{job.totalSkills} skills matched</span>
                  <span className={`source-badge ${job.source_label}`}>{job.source_label === 'real' ? '● Real' : '○ Sample'}</span>
                </div>

                <div className="job-card-skills">
                  {job.matchedSkills.slice(0, 4).map(s => (
                    <span key={s.id} className="mini-tag matched">{s.name}</span>
                  ))}
                  {job.missingSkills.slice(0, 3).map(s => (
                    <span key={s.id} className="mini-tag missing">{s.name}</span>
                  ))}
                  {(job.matchedSkills.length + job.missingSkills.length) > 7 && (
                    <span className="mini-tag more">+{job.totalSkills - 7} more</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && matches.length === 0 && (
        <div className="panel state-panel">
          <p>No job postings found in the database. Run the scraper to add some!</p>
        </div>
      )}

      <div className="step-nav">
        <button className="secondary-button" onClick={() => setStep(3)}>← Back to Evidence</button>
        <button className="primary-button" onClick={() => setStep(5)}>Continue to Analysis →</button>
      </div>
      
          </div>
  );
};
