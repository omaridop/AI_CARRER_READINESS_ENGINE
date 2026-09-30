import React, { useEffect, useState, useRef } from 'react';
import { useWizard } from '../context/WizardContext';
import { apiFetch } from '../utils/api';
import { ErrorMessage } from '../components/common/ErrorMessage';
import type { AnalysisResult } from '../utils/contracts';

export const AnalysisLoading: React.FC = () => {
  const { profileName, skills, setStudentId, setAnalysisResult, setStep, targetJobTitle, magicModeData } = useWizard();
  const [error, setError] = useState<string | null>(null);
  
  // StrictMode can resubscribe to this operation without creating duplicate profiles.
  const operationRef = useRef<Promise<{ studentId: number; result: AnalysisResult }> | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const runFullAnalysis = async () => {
        // 1. Save Profile
        const profilePayload = {
          name: profileName || 'Student',
          skills: skills.map(s => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
            evidenceType: s.evidenceType
          }))
        };

        const profileRes = await apiFetch<{ studentId: number; message: string }>('/profile', {
          method: 'POST',
          body: JSON.stringify(profilePayload)
        });
        if (profileRes.error || !profileRes.data) {
          throw new Error(profileRes.error || "Failed to save profile");
        }

        const studentId = profileRes.data.studentId;

        // 2. Run Analysis
        if (targetJobTitle !== 'Junior Data Analyst' && magicModeData) {
          // Map magic data to AnalysisResult
          const missing = magicModeData.similarityData.missing || [];
          
          const fakeResult = {
            analysisId: Date.now(),
            readinessScore: magicModeData.similarityData.score || 0,
            gaps: missing.map((m: any, i: number) => ({ skillId: i, skillName: m, gapWeight: 1, priorityRank: i+1 })),
            roadmap: missing.map((m: any, i: number) => ({
              skillId: i,
              skillName: m,
              sequenceOrder: i+1,
              title: "Learn " + m,
              description: "Acquire the missing skill required for the role.",
              assessmentIdea: "Practice with a basic tutorial",
              estimatedHours: 5
            }))
          };
          return { studentId, result: fakeResult as any };
        }

        const analysisPayload = {
          studentId: studentId,
          roleName: targetJobTitle
        };
        const analysisRes = await apiFetch<AnalysisResult>('/analysis', {
          method: 'POST',
          body: JSON.stringify(analysisPayload)
        });
        if (analysisRes.error || !analysisRes.data) {
          throw new Error(analysisRes.error || "Failed to generate analysis");
        }

        return { studentId, result: analysisRes.data };
    };

    operationRef.current ??= runFullAnalysis();
    operationRef.current.then(({ studentId, result }) => {
      if (!isSubscribed) return;
      setStudentId(studentId);
      setAnalysisResult(result);
      setStep(6);
    }).catch((err: unknown) => {
      if (isSubscribed) setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    });

    return () => {
      isSubscribed = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Failed</h2>
        <ErrorMessage message={error} />
        <button
          onClick={() => setStep(4)}
          className="mt-6 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow text-center h-[300px] flex flex-col justify-center items-center">
      <div className="loading-symbol" aria-hidden="true">↗</div>
      <p className="eyebrow">TURNING YOUR SKILLS INTO A PLAN</p><h2 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Profile</h2>
      <p className="text-gray-500 font-medium">Saving your profile and matching it against the stored role requirements...</p>
    </div>
  );
};
