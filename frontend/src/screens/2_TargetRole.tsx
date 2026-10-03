import React, { useEffect } from 'react';
import { useWizard } from '../context/WizardContext';
import { useApi } from '../hooks/useApi';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const TargetRole: React.FC = () => {
  const { setStep, targetJobTitle, magicModeData } = useWizard();
  const { data: requirements, error, isLoading, isIdle, execute } = useApi<{ skillName: string; weight: number }[]>();

  useEffect(() => {
    if (targetJobTitle === 'Junior Data Analyst') {
      execute('/roles/Junior%20Data%20Analyst/requirements');
    }
  }, [execute]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6 flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Target Role</h2>
          <p className="text-gray-600 mt-1">
            One focused goal. See the skills behind your requirement match.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Selected: {targetJobTitle}
        </span>
      </div>

      <ErrorMessage message={error} />

      <div className="bg-gray-50 border border-gray-200 rounded p-6 mb-8 min-h-[200px]">
        {targetJobTitle !== 'Junior Data Analyst' && magicModeData ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Magic Mode Discovered Skills</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {magicModeData.discoveredSkills.map((req: any, idx: number) => (
                <li key={idx} className="flex justify-between items-center bg-white p-3 border border-gray-100 rounded shadow-sm">
                  <span className="font-medium text-gray-700">{req.skill}</span>
                  <span className="text-xs text-gray-500 font-mono">Market: {req.percentage}%</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-4 text-center">Requirements dynamically discovered via live scraping.</p>
          </div>
        ) : isLoading || isIdle ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading market requirements...</p>
          </div>
        ) : error ? (<p className="text-sm text-gray-600">We couldn’t load the requirements. <button className="quiet-button" onClick={() => execute('/roles/Junior%20Data%20Analyst/requirements')}>Try again</button></p>) : Array.isArray(requirements) && requirements.length === 0 ? (<p>No requirements available for this role yet.</p>) : Array.isArray(requirements) && requirements.every(r => r && typeof r.skillName === 'string' && Number.isFinite(r.weight)) ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Requirements (Top Skills)</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requirements.slice(0, 10).map((req, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white p-3 border border-gray-100 rounded shadow-sm">
                  <span className="font-medium text-gray-700">{req.skillName}</span>
                  <span className="text-xs text-gray-500 font-mono">Weight: {(req.weight * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-4 text-center">Top requirements from 7 real and 30 labeled sample postings. This demonstration dataset is not a representative market estimate or a live scan.</p>
          </div>
        ) : <p role="alert">The requirements response is unavailable or invalid. Please try again.</p>}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={(targetJobTitle === 'Junior Data Analyst') ? (isLoading || !!error || !Array.isArray(requirements) || requirements.length === 0) : !magicModeData}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Evidence Mapping
        </button>
      </div>
    </div>
  );
};
