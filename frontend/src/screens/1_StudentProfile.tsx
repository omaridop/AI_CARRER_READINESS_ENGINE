import React, { useState } from 'react';
import { useWizard, StudentSkill } from '../context/WizardContext';
import { useApi } from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const StudentProfile: React.FC = () => {
  const { profileName, setProfileName, skills, setSkills, setStep, taxonomy } = useWizard();
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = (suggestion?: string) => {
    const input = (suggestion ?? skillInput).trim().toLowerCase();
    if (!input) return;

    // Check if we already added it
    if (skills.some(s => s.name.toLowerCase() === input)) {
      setError(`You have already added this skill.`);
      setSkillInput('');
      return;
    }

    // See if it's in taxonomy to get the real ID, otherwise make a temporary one
    const taxonomySkill = taxonomy.find(s => 
      s.name.toLowerCase() === input || s.aliases.some((a: string) => a.toLowerCase() === input)
    );

    const newSkill: StudentSkill = {
      skillId: taxonomySkill ? taxonomySkill.id : -Date.now(), // Temporary ID for custom skills
      name: taxonomySkill ? taxonomySkill.name : (suggestion ?? skillInput).trim(),
      proficiency: 'beginner',
      evidenceType: 'self_declared'
    };

    setSkills([...skills, newSkill]);
    setSkillInput('');
    setError(null);
  };

  const removeSkill = (idToRemove: number) => {
    setSkills(skills.filter(s => s.skillId !== idToRemove));
    setError(null);
  };

  // Normalizer states
  const [rawSkillsText, setRawSkillsText] = useState('');
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizedSkills, setNormalizedSkills] = useState<{original: string, corrected: string, confidence: number}[] | null>(null);
  const { execute: executeNormalize } = useApi();

  const handleNormalize = async () => {
    if (!rawSkillsText.trim()) return;
    setIsNormalizing(true);
    setError(null);
    try {
      const res = await executeNormalize('/skills-ai/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawSkillsText })
      });
      if (res.error) throw new Error(res.error);
      setNormalizedSkills(res.data.normalized);
    } catch (err: any) {
      setError(err.message || 'Failed to normalize skills');
    } finally {
      setIsNormalizing(false);
    }
  };

  const acceptNormalizedSkill = (correctedName: string) => {
    handleAddSkill(correctedName);
  };

  const handleContinue = () => {
    if (skills.length === 0) {
      setError("Please add at least one skill before continuing.");
      return;
    }
    setStep(2);
  };

  const [jobTitle, setJobTitle] = useState('');
  const [normalizedJob, setNormalizedJob] = useState<{original: string, corrected: string, confidence: number} | null>(null);
  const [isNormalizingJob, setIsNormalizingJob] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [discoveredSkills, setDiscoveredSkills] = useState<{skill: string, percentage: number, category: string}[]>([]);
  const [similarityData, setSimilarityData] = useState<{score: number, matched: any[], missing: any[]} | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const { execute: executeMagic } = useApi();
  const { execute: executeSkillsRefresh } = useApi();
  const { execute: executeJobNormalize } = useApi();

  // SSE live progress state
  const [progressSteps, setProgressSteps] = useState<{step: string, message: string, detail?: string, percent?: number}[]>([]);

  const handleNormalizeJob = async () => {
    if (!jobTitle.trim()) return;
    setIsNormalizingJob(true);
    setError(null);
    try {
      const res = await executeJobNormalize('/skills-ai/normalize-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle })
      });
      if (res.error) throw new Error(res.error);
      setNormalizedJob(res.data.normalized);
    } catch (err: any) {
      setError(err.message || "Failed to normalize job title");
    } finally {
      setIsNormalizingJob(false);
    }
  };

  const handleConfirmJob = () => {
    if (normalizedJob) {
      setJobTitle(normalizedJob.corrected);
      setNormalizedJob(null);
    }
  };

  const handleMagicScrape = async () => {
    if (!jobTitle) {
      setError("Please enter a Target Job Title first.");
      return;
    }
    
    setIsMagicLoading(true);
    setError(null);
    setEnhancedText('');
    setSimilarityData(null);
    setDiscoveredSkills([]);
    setProgressSteps([]);
    
    try {
      // Step 1: Start the job and get a jobId
      const res = await executeMagic('/live/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobTitle, 
          currentProfileText: profileText,
          userSkills: skills.map(s => s.name)
        })
      });
      
      if (res.error) throw new Error(res.error);
      const jobId = res.data?.jobId;
      if (!jobId) throw new Error('No job ID returned');

      // Step 2: Connect to SSE for live progress
      await new Promise<void>((resolve, reject) => {
        const eventSource = new EventSource(`http://localhost:3001/api/live/progress/${jobId}`);
        
        eventSource.addEventListener('progress', (e) => {
          try {
            const data = JSON.parse(e.data);
            setProgressSteps(prev => [...prev, data]);
          } catch {}
        });

        eventSource.addEventListener('complete', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.enhancedProfile) setEnhancedText(data.enhancedProfile);
            if (data.dynamicSkills) setDiscoveredSkills(data.dynamicSkills);
            if (data.similarityScore !== undefined) {
              setSimilarityData({
                score: data.similarityScore,
                matched: data.matchedSkills || [],
                missing: data.missingSkills || []
              });
            }
          } catch {}
          eventSource.close();
          resolve();
        });

        eventSource.addEventListener('error', (e) => {
          // Check if this is a server-sent error event or a connection error
          if (e instanceof MessageEvent) {
            try {
              const data = JSON.parse(e.data);
              reject(new Error(data.error || 'Job failed'));
            } catch {
              reject(new Error('Job failed'));
            }
          }
          eventSource.close();
          // EventSource auto-reconnects on generic errors; close and reject
          reject(new Error('Lost connection to progress stream'));
        });
      });

      // Refresh taxonomy after new skills were added
      await executeSkillsRefresh('/skills');
      
    } catch (err: any) {
      setError(err.message || "Failed to run Magic AI.");
    } finally {
      setIsMagicLoading(false);
    }
  };

  return (
    <div className="profile-panel max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      
      {/* ── NEW MAGIC AI SECTION ── */}
      <div className="p-5 mb-8 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-2">✨ Live Job Enhancer (Magic Mode)</h3>
        <p className="text-sm text-blue-800 mb-4">
          Type exactly the job you want. We will scrape live jobs for it, dynamically discover the exact skills employers are asking for, and use AI to enhance your profile text!
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-900 mb-1">Target Job Title</label>
          <div className="flex gap-2">
            <input
              type="text" className="w-full p-2 border border-blue-300 rounded" placeholder="e.g. ai enginer"
              value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            />
            <button 
              onClick={handleNormalizeJob} disabled={isNormalizingJob || !jobTitle}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded font-medium hover:bg-blue-200 transition disabled:opacity-50 whitespace-nowrap"
            >
              {isNormalizingJob ? 'Checking...' : 'Check Spelling'}
            </button>
          </div>
          {normalizedJob && (
            <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-sm flex items-center justify-between">
              <span>
                Did you mean: <span className="font-bold text-green-700">{normalizedJob.corrected}</span>?
                <span className="text-gray-400 ml-2">({normalizedJob.confidence * 100}% confident)</span>
              </span>
              <button onClick={handleConfirmJob} className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">
                Confirm
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-900 mb-1">Your Current Profile/Resume Summary</label>
          <textarea
            className="w-full p-2 border border-blue-300 rounded" rows={3} placeholder="I am a fresh graduate looking for..."
            value={profileText} onChange={e => setProfileText(e.target.value)}
          ></textarea>
        </div>
        
        <button 
          onClick={handleMagicScrape} disabled={isMagicLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isMagicLoading ? '⏳ Running live pipeline…' : '✨ Enhance Profile & Discover Skills'}
        </button>
        
        {/* ── SSE Live Progress Display ── */}
        {isMagicLoading && progressSteps.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="animate-pulse">📡</span> Live Pipeline Progress
            </h4>
            {/* Progress bar */}
            {progressSteps.length > 0 && (
              <div className="w-full h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressSteps[progressSteps.length - 1]?.percent || 0}%` }}
                />
              </div>
            )}
            {/* Step list */}
            <ul className="space-y-1.5 text-sm">
              {progressSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${idx === progressSteps.length - 1 ? 'text-blue-600 animate-pulse' : 'text-green-600'}`}>
                    {idx === progressSteps.length - 1 ? '◉' : '✓'}
                  </span>
                  <div>
                    <span className="font-medium text-gray-800">{step.message}</span>
                    {step.detail && (
                      <span className="ml-2 text-gray-500 text-xs">({step.detail})</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show progress even after completion as a summary */}
        {!isMagicLoading && progressSteps.length > 0 && (similarityData || enhancedText) && (
          <details className="mt-3 text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Pipeline log ({progressSteps.length} steps)</summary>
            <ul className="mt-1 space-y-0.5 pl-4">
              {progressSteps.map((step, idx) => (
                <li key={idx}>✓ {step.message}{step.detail ? ` — ${step.detail}` : ''}</li>
              ))}
            </ul>
          </details>
        )}
        
        {enhancedText && (
          <div className="mt-4 p-4 bg-white border border-green-200 rounded">
            <h4 className="font-bold text-green-800 mb-2">✅ AI Enhanced Profile (Copy this!)</h4>
            <p className="text-gray-800 text-sm whitespace-pre-wrap">{enhancedText}</p>
          </div>
        )}

        {similarityData && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded print:bg-white print:border-none print:p-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-indigo-900">🎯 Similarity Match Score</h4>
              <button 
                onClick={() => window.print()}
                className="print:hidden px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
              >
                📥 Export PDF Report
              </button>
            </div>
            
            <div className="flex items-center gap-6 mb-4">
              <div className="w-40 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: similarityData.score },
                        { name: 'Missing', value: 100 - similarityData.score }
                      ]}
                      cx="50%" cy="100%" startAngle={180} endAngle={0}
                      innerRadius={40} outerRadius={60}
                      paddingAngle={0} dataKey="value" stroke="none"
                    >
                      <Cell fill="#4338ca" />
                      <Cell fill="#e0e7ff" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <span className="text-3xl font-black text-indigo-700">{similarityData.score}</span>
                </div>
              </div>
              <p className="text-sm text-indigo-800 flex-1">Your current skills matched against live market requirements. The circular gauge shows your overall fit.</p>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-1">
                <h5 className="text-sm font-bold text-green-700 mb-1">✅ Matched Skills</h5>
                <ul className="text-xs text-gray-700 list-disc pl-4">
                  {similarityData.matched.map((s, i) => <li key={i}>{s.skill} ({s.percentage}%)</li>)}
                  {similarityData.matched.length === 0 && <li className="italic text-gray-400">None yet</li>}
                </ul>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-red-700 mb-1">❌ Missing Skills</h5>
                <ul className="text-xs text-gray-700 space-y-4 pl-4">
                  {similarityData.missing.map((s, i) => (
                    <li key={i}>
                      <div className="font-semibold">{s.skill} ({s.percentage}%)</div>
                      {s.courses && s.courses.length > 0 ? (
                        <div className="mt-2 space-y-2 border-l-2 border-blue-200 pl-2">
                          {s.courses.map((c: any, ci: number) => (
                            <div key={ci} className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                              <a href={c.url} target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline block text-[11px]">
                                {c.provider === 'Udemy' ? '🎓 Udemy' : '🎓 Coursera'}: {c.title}
                              </a>
                              <p className="text-[10px] text-gray-500 mt-1">{c.whyRelevant}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 flex gap-2">
                          <span className="text-gray-500 italic">No verified courses found.</span>
                          <a href={`https://www.udemy.com/courses/search/?src=ukw&q=${encodeURIComponent(s.skill)}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline print:hidden">🔍 Search Udemy</a>
                          <a href={`https://www.coursera.org/search?query=${encodeURIComponent(s.skill)}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline print:hidden">🔍 Search Coursera</a>
                        </div>
                      )}
                    </li>
                  ))}
                  {similarityData.missing.length === 0 && <li className="italic text-gray-400">You have everything!</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {discoveredSkills.length > 0 && (
          <div className="mt-4 p-4 bg-white border border-blue-200 rounded">
            <h4 className="font-bold text-blue-800 mb-4">📊 Market Skill Requirements (%)</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discoveredSkills} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={60} tick={{fontSize: 11}} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 11}} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Frequency']} />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">These skills have been permanently added to the database. You can now type them below!</p>
          </div>
        )}
      </div>
      
      <hr className="my-6 border-gray-200" />

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Student Profile</h2>
      <p className="profile-note">Start with the skills you already know. You’ll add their evidence next.</p>
      
      <div className="profile-fields">
      
      <div className="mb-6">
        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">
          Name / Nickname (Optional)
        </label>
        <input
          id="profile-name" type="text"
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. Alex"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Skills (Free Text AI Spell-Corrector)
        </label>
        <p className="text-xs text-gray-500 mb-2">Type ANY skills separated by commas or spaces. Our AI will fix typos and normalize them.</p>
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="e.g. pytho oop c++ problem solving react.js"
            value={rawSkillsText}
            onChange={(e) => {
              setRawSkillsText(e.target.value);
              setError(null);
            }}
          />
          <button 
            onClick={handleNormalize} disabled={isNormalizing || !rawSkillsText}
            className="self-end px-6 py-2 bg-indigo-100 text-indigo-700 font-medium rounded hover:bg-indigo-200 transition disabled:opacity-50"
          >
            {isNormalizing ? 'Fixing Typos...' : 'Check & Add Skills'}
          </button>
        </div>

        {normalizedSkills && (
          <div className="mt-4 p-4 border border-indigo-200 bg-indigo-50 rounded">
            <h4 className="font-bold text-indigo-900 mb-2">AI Corrections:</h4>
            <ul className="text-sm space-y-2">
              {normalizedSkills.map((ns, idx) => (
                <li key={idx} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                  <span>
                    <del className="text-red-400 mr-2">{ns.original}</del> &rarr; <span className="font-bold text-green-600 ml-2">{ns.corrected}</span>
                    <span className="text-xs text-gray-400 ml-2">(Confidence: {ns.confidence * 100}%)</span>
                  </span>
                  <button onClick={() => acceptNormalizedSkill(ns.corrected)} className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      </div><div className="mb-8"><div className="selected-skills-label"><span>Your starting toolkit</span><span aria-live="polite">{skills.length} selected</span></div>
        <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50 border border-gray-200 rounded">
          {skills.length === 0 ? (
            <p className="text-gray-400 italic">No skills added yet. Add some above!</p>
          ) : (
            skills.map(s => (
              <span key={s.skillId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {s.name}
                <button 
                  aria-label={`Remove ${s.name}`} onClick={() => removeSkill(s.skillId)}
                  className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="form-footer"><p>No account needed. Your skills are the starting point.</p>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
