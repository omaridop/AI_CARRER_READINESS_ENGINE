import React from 'react';
import { useWizard, EvidenceType } from '../context/WizardContext';

export const EvidenceMapper: React.FC = () => {
  const { skills, updateSkillEvidence, setStep } = useWizard();

  const EVIDENCE_OPTIONS: { value: EvidenceType; label: string; desc: string }[] = [
    { value: 'self_declared', label: 'Self-Declared', desc: 'I know this, but have no formal proof.' },
    { value: 'course', label: 'Course', desc: 'Completed academic or online coursework.' },
    { value: 'project', label: 'Project', desc: 'Applied in a real project.' },
    { value: 'certificate', label: 'Certificate', desc: 'Hold an official certification.' },
  ];

  return (
    <div className="evidence-panel max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <p className="eyebrow">GIVE YOUR SKILLS SOME CONTEXT</p><h2 className="text-2xl font-bold text-gray-800 mb-2">Map Your Evidence</h2>
      <p className="text-gray-600 mb-6">
        For each skill, select the strongest evidence you have. Course, project, and certificate selections receive full credit; self-declarations receive half credit. Evidence is self-reported and is not independently verified by this MVP.
      </p>

      {skills.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">You didn't add any skills in Step 1. You can still analyze, but your score will be 0%.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {skills.map(s => (
            <fieldset key={s.skillId} className="evidence-skill border border-gray-200 rounded p-4 bg-gray-50">
              <legend className="font-semibold text-lg text-gray-800 px-2">{s.name}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EVIDENCE_OPTIONS.map(opt => (
                  <label 
                    key={opt.value} 
                    className={`flex items-start p-3 border rounded cursor-pointer transition ${
                      s.evidenceType === opt.value 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`evidence-${s.skillId}`} 
                      value={opt.value}
                      checked={s.evidenceType === opt.value}
                      onChange={() => updateSkillEvidence(s.skillId, opt.value)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">{opt.label} <span className="evidence-credit">{opt.value === 'self_declared' ? '½ credit' : 'Full credit'}</span></span>
                      <span className="block text-xs text-gray-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition"
        >
          Run Analysis
        </button>
      </div>
    </div>
  );
};
