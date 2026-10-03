import React, { useEffect, useRef } from 'react';
import { useWizard } from './context/WizardContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { StepIndicator } from './components/StepIndicator';
import { StudentProfile } from './screens/1_StudentProfile';
import { TargetRole } from './screens/2_TargetRole';
import { EvidenceMapper } from './screens/3_EvidenceMapper';
import { JobMatch } from './screens/4_JobMatch';
import { AnalysisLoading } from './screens/5_AnalysisLoading';
import { ResultsDashboard } from './screens/6_ResultsDashboard';
import { AdaptiveTutor } from './screens/7_AdaptiveTutor';

const WizardRouter: React.FC = () => {
  const { currentStep } = useWizard();
  switch (currentStep) {
    case 1: return <StudentProfile />;
    case 2: return <TargetRole />;
    case 3: return <EvidenceMapper />;
    case 4: return <JobMatch />;
    case 5: return <AnalysisLoading />;
    case 6: return <ResultsDashboard />;
    case 7: return <AdaptiveTutor />;
    default: return <StudentProfile />;
  }
};

function App() {
  const { resetWizard, currentStep } = useWizard();
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    content.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);

  return (
    <div className="app-shell">
      <a href="#workspace" className="skip-link">Skip to workspace</a>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand"><span className="brand-mark" aria-hidden="true">S<span>↗</span></span><div><h1>SkillBridge</h1><span className="brand-caption">FROM SKILLS TO YOUR NEXT STEP</span></div></div>
          <div className="header-actions"><span className="demo-label">Career readiness · MVP</span>{currentStep > 1 && <button onClick={resetWizard} className="quiet-button">Start Over</button>}</div>
        </div>
      </header>
      <main className="workspace" id="workspace">
        <StepIndicator />
        {currentStep === 1 && <section className="intro"><div><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h2>Know your skills.<br /><span>Find your next step.</span></h2><p>Connect what you know to what a Junior Data Analyst role asks for. Leave with a clear learning plan, and a tutor to help you begin.</p></div><aside className="journey-preview" aria-label="What you will get"><span className="eyebrow">A CLEARER PATH FORWARD</span><div><b>01</b><p><strong>See where you stand</strong><span>An explainable requirement match.</span></p></div><div><b>02</b><p><strong>Match against real jobs</strong><span>See which postings fit your skills.</span></p></div><div><b>03</b><p><strong>Learn in your own way</strong><span>Five tutor styles, including Arabic.</span></p></div></aside></section>}
        <div ref={content} tabIndex={-1} className="screen-content" key={currentStep} aria-label="Current step">
          <ErrorBoundary><WizardRouter /></ErrorBoundary>
        </div>
        <footer className="app-footer"><span>Built for your next learning step.</span><span>One focused role. Transparent scoring. No hiring predictions.</span></footer>
      </main>
    </div>
  );
}
export default App;
