import { useWizard } from '../context/WizardContext';
const STEPS = ['Profile', 'Target Role', 'Evidence', 'Job Match', 'Analysis', 'Results', 'Tutor'];
export const StepIndicator = () => {
  const { currentStep } = useWizard();
  return <nav className="stepper" aria-label="Your learning journey"><ol>{STEPS.map((step, index) => <li key={step} className={currentStep === index + 1 ? 'active' : currentStep > index + 1 ? 'complete' : ''} aria-current={currentStep === index + 1 ? 'step' : undefined}><span className="step-number" aria-hidden="true">{currentStep > index + 1 ? '✓' : String(index + 1).padStart(2, '0')}</span><span>{step}</span></li>)}</ol><p>STEP {String(currentStep).padStart(2, '0')} / 07</p></nav>;
};
