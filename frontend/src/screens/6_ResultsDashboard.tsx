import type { CSSProperties } from 'react';
import { useWizard } from '../context/WizardContext';

export const ResultsDashboard = () => {
  const { analysisResult, skills, resetWizard, setSelectedGapSkill, setStep } = useWizard();
  if (!analysisResult || !Number.isFinite(analysisResult.readinessScore) || !Array.isArray(analysisResult.gaps) || !Array.isArray(analysisResult.roadmap)) {
    return <div className="panel state-panel"><h2>Your results are unavailable</h2><p>Start again to build a new requirement match.</p><button className="primary-button" onClick={resetWizard}>Start Over</button></div>;
  }
  const { readinessScore, gaps, roadmap } = analysisResult;
  const evidenceCount = skills.filter(s => s.evidenceType !== 'self_declared').length;
  const nextStep = roadmap[0];
  const learn = (skill: string) => { setSelectedGapSkill(skill); setStep(7); };
  return <div className="results-workspace">
    <div className="section-heading"><div><p className="eyebrow">YOUR PERSONAL LEARNING DIRECTION</p><h2>Target Role: Junior Data Analyst</h2><p>Your starting point is clearer. Now turn a gap into a new skill.</p></div><span className="status-badge">✓ Analysis complete</span></div>
    <div className="results-summary">
      <section className="score-panel panel" aria-label="Requirement match summary">
        <p className="eyebrow">YOUR REQUIREMENT MATCH</p><div className="score-value"><span className="text-6xl">{readinessScore.toFixed(1)}%</span></div>
        <p className="score-caption"><strong>requirement match</strong> · Not a hiring probability</p>
        <div className="score-track" role="progressbar" aria-label="Requirement match" aria-valuenow={readinessScore} aria-valuemin={0} aria-valuemax={100}><span style={{ '--score-scale': readinessScore / 100 } as CSSProperties} /></div>
        <p className="score-basis">Based on {skills.length} selected {skills.length === 1 ? 'skill' : 'skills'}: {evidenceCount} with course, project or certificate evidence; {skills.length - evidenceCount} self-declared.</p>
        <details className="score-details"><summary>How this score works</summary><p>Core requirements appearing in at least 15% of stored postings form the denominator. Course, project and certificate selections receive full credit; self-declarations receive half credit. Supplementary skills add credit, capped at 100%. Selected evidence is self-reported, not independently verified. A capped score can still have gaps.</p><p>The current demonstration dataset has 7 real and 30 labeled sample postings. It is not a representative market estimate or a live market scan.</p></details>
      </section>
      <section className="next-step-panel"><p className="eyebrow">YOUR NEXT BEST STEP</p>{nextStep ? <><span className="next-step-index" aria-hidden="true">01 / START HERE</span><h3>{nextStep.skillName}</h3><p>Begin with {nextStep.skillName} in your learning sequence. Get an explanation that fits you, then try the practice task below.</p><button className="light-button" onClick={() => learn(nextStep.skillName)}>Start learning {nextStep.skillName} <span aria-hidden="true">↗</span></button><span className="next-step-note">From your sequenced roadmap · Learn in five styles</span></> : <><h3>All listed requirements covered.</h3><p>Your selected evidence covers the stored requirement set. Keep practicing your skills; this match is not an independent assessment of competence.</p></>}</section>
    </div>
    <section className="panel roadmap-panel"><div className="section-heading"><div><p className="eyebrow">A PLAN YOU CAN ACT ON</p><h3>Your Learning Roadmap</h3></div><span className="muted">{roadmap.length} learning {roadmap.length === 1 ? 'step' : 'steps'}</span></div><p className="muted roadmap-intro">Priority gaps, arranged in a prerequisite-aware learning order. Time estimates are a guide.</p><div className="roadmap-grid">{roadmap.length === 0 ? <p>No roadmap items needed for this requirement set.</p> : roadmap.map((item, index) => <article className="roadmap-card" key={item.skillId}><div className="roadmap-meta"><span className="roadmap-number">{String(index + 1).padStart(2, '0')}</span><span>≈ {item.estimatedHours} hours</span></div><h4>{item.skillName}</h4><p>{item.description}</p><div className="practice"><strong>Practice:</strong><p>{item.assessmentIdea}</p></div><button className="text-button" onClick={() => learn(item.skillName)}>Explore this lesson <span aria-hidden="true">↗</span></button></article>)}</div></section>
    <section className="panel gaps-panel"><div className="section-heading"><div><p className="eyebrow">UNDERSTAND THE OPPORTUNITIES</p><h3>Identified Skill Gaps</h3></div><span className="count-badge">{gaps.length}</span></div><p className="muted">Missing or partially credited requirements, ranked by their weight × uncredited portion.</p>{gaps.length === 0 ? <p className="empty-success">No gaps in the stored requirements for your selected evidence.</p> : <div className="gap-list">{gaps.map(gap => <article className="gap-row" key={gap.skillId}><span className="gap-rank">{String(gap.priorityRank).padStart(2, '0')}</span><div><h4>{gap.skillName}</h4><p>Weighted gap: {(gap.gapWeight * 100).toFixed(1)}%</p></div><button className="secondary-button" onClick={() => learn(gap.skillName)}>Learn this skill <span aria-hidden="true">↗</span></button></article>)}</div>}</section>
    <div className="reset-row"><p>Try different evidence to explore how your match changes.</p><button className="quiet-button" onClick={resetWizard}>Start Over / New Student</button></div>
  </div>;
};
