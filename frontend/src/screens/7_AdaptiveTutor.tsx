import React, { useEffect, useState } from 'react';
import { useWizard } from '../context/WizardContext';
import { useApi } from '../hooks/useApi';
import { ErrorMessage } from '../components/common/ErrorMessage';
import type { ExplanationStyle, TutorResponse } from '../utils/contracts';
import { CourseRecommendations } from '../components/CourseRecommendations';

const STYLES: { value: ExplanationStyle; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'visual', label: 'Visual' },
  { value: 'example', label: 'Example-based' },
  { value: 'step_by_step', label: 'Step-by-step' },
  { value: 'arabic', label: 'Arabic' },
];

export const AdaptiveTutor: React.FC = () => {
  const { selectedGapSkill, setStep, resetWizard } = useWizard();
  const [currentStyle, setCurrentStyle] = useState<ExplanationStyle>('simple');
  const { data: tutorData, error, isLoading, isIdle, execute } = useApi<TutorResponse>();

  // Fetch explanation when style or skill changes
  useEffect(() => {
    if (!selectedGapSkill) return;
    execute('/tutor/explain', {
      method: 'POST',
      body: JSON.stringify({
        skillName: selectedGapSkill,
        style: currentStyle
      })
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStyle, selectedGapSkill]);

  if (!selectedGapSkill) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error: No gap skill selected.</p>
        <button onClick={() => setStep(6)} className="mt-4 px-4 py-2 bg-gray-200 rounded">Go Back</button>
      </div>
    );
  }

  return (
    <div className="tutor-workspace max-w-4xl mx-auto space-y-6 pb-12">
      <div className="tutor-heading flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <p className="eyebrow">ONE GAP. A NEW WAY TO UNDERSTAND IT.</p><h2 className="text-2xl font-bold text-gray-800">Adaptive Tutor</h2>
          <p className="text-gray-500">Learning: <span className="font-semibold text-blue-600">{selectedGapSkill}</span></p>
        </div>
        <button
          onClick={() => setStep(6)}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          Back to Roadmap
        </button>
      </div>

      {/* Style Picker */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Try a different style</h3>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s.value}
              aria-pressed={currentStyle === s.value} onClick={() => setCurrentStyle(s.value)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                currentStyle === s.value 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Tutor Content */}
      <div className="tutor-content bg-white p-8 rounded-lg shadow min-h-[300px] relative">
        {isLoading || isIdle || (!error && tutorData && tutorData.style !== currentStyle) ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-4">
            <div className="loading-symbol" aria-hidden="true">↗</div>
            <p className="text-gray-500 font-medium">Generating your explanation...</p><p className="text-xs text-gray-500">If live AI is unavailable, a clearly labeled fallback will appear.</p>
          </div>
        ) : error ? (<div className="state-panel"><p>Your lesson couldn’t load. You can retry or choose another style.</p><button className="secondary-button" onClick={() => execute('/tutor/explain', { method: 'POST', body: JSON.stringify({ skillName: selectedGapSkill, style: currentStyle }) })}>Retry explanation</button></div>) : tutorData && typeof tutorData.explanation_text === 'string' && tutorData.explanation_text.trim() ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">{STYLES.find(s => s.value === tutorData.style)?.label ?? tutorData.style} Explanation</h3>
              
              {/* Honest Source Labeling */}
              {tutorData.source === 'fallback' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium" title="Displaying a pre-written explanation because a validated live response was unavailable.">
                  <span>🛡️</span> Curated Example
                </div>
              ) : tutorData.source === 'ai' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <span>✨</span> Live AI Generation
                </div>
              ) : <span>Source unavailable</span>}
            </div>

            <div dir={tutorData.style === 'arabic' ? 'rtl' : 'ltr'} className="prose max-w-none text-gray-700 whitespace-pre-wrap font-sans">
              {tutorData.explanation_text}
            </div>

            {tutorData.example && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-2">Example:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{tutorData.example}</code>
                </pre>
              </div>
            )}

            {tutorData.notes && (
              <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-1">Key Takeaway</h4>
                <p className="text-sm text-blue-900">{tutorData.notes}</p>
              </div>
            )}
          </div>
        ) : <p role="status">No explanation was returned. Choose another style or return to your roadmap.</p>}
      </div>

      <CourseRecommendations skill={selectedGapSkill} />

      <div className="text-center mt-12">
        <button 
          onClick={resetWizard}
          className="px-8 py-3 bg-gray-800 text-white font-medium rounded shadow hover:bg-gray-900 transition"
        >
          Reset Demo State / Start Over
        </button>
      </div>
    </div>
  );
};
