import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi } from '../hooks/useApi';
import type { AnalysisResult } from '../utils/contracts';

export type EvidenceType = 'self_declared' | 'course' | 'project' | 'certificate';

export interface StudentSkill {
  skillId: number;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  evidenceType: EvidenceType;
}

export interface TaxonomySkill {
  id: number;
  name: string;
  category: string;
  aliases: string[];
}

interface WizardState {
  currentStep: number;
  profileName: string;
  skills: StudentSkill[];
  studentId: number | null;
  analysisResult: AnalysisResult | null;
  taxonomy: TaxonomySkill[];
  isTaxonomyLoading: boolean;
  taxonomyError: string | null;
  selectedGapSkill: string | null;
  targetJobTitle: string;
  magicModeData: any | null;
}

interface WizardContextType extends WizardState {
  setStep: (step: number) => void;
  setProfileName: (name: string) => void;
  setSkills: (skills: StudentSkill[]) => void;
  updateSkillEvidence: (skillId: number, evidenceType: EvidenceType) => void;
  setStudentId: (id: number) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setSelectedGapSkill: (skill: string | null) => void;
  setTargetJobTitle: (title: string) => void;
  setMagicModeData: (data: any) => void;
  resetWizard: () => void;
}

const initialState: WizardState = {
  currentStep: 1,
  profileName: '',
  skills: [],
  studentId: null,
  analysisResult: null,
  taxonomy: [],
  isTaxonomyLoading: true,
  taxonomyError: null,
  selectedGapSkill: null,
  targetJobTitle: 'Junior Data Analyst',
  magicModeData: null,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WizardState>(initialState);
  const { execute } = useApi<{ skills: TaxonomySkill[] }>();

  useEffect(() => {
    let subscribed = true;
    execute('/skills').then(res => {
      if (!subscribed) return;
      const items = res.data?.skills;
      const valid = Array.isArray(items) && items.every(s => s && Number.isFinite(s.id) && typeof s.name === 'string' && Array.isArray(s.aliases) && s.aliases.every(a => typeof a === 'string'));
      setState(s => ({ ...s, taxonomy: valid ? items : [], isTaxonomyLoading: false,
        taxonomyError: res.error || (valid ? null : 'The skills response was invalid. Reload to try again.') }));
    });
    return () => { subscribed = false; };
  }, [execute]);

  const setStep = (step: number) => setState((s) => ({ ...s, currentStep: step }));
  const setProfileName = (profileName: string) => setState((s) => ({ ...s, profileName }));
  const setSkills = (skills: StudentSkill[]) => setState((s) => ({ ...s, skills }));
  const updateSkillEvidence = (skillId: number, evidenceType: EvidenceType) => {
    setState((s) => ({
      ...s,
      skills: s.skills.map((skill) =>
        skill.skillId === skillId ? { ...skill, evidenceType } : skill
      ),
    }));
  };
  const setStudentId = (studentId: number) => setState((s) => ({ ...s, studentId }));
  const setAnalysisResult = (analysisResult: AnalysisResult) => setState((s) => ({ ...s, analysisResult }));
  const setSelectedGapSkill = (skill: string | null) => setState((s) => ({ ...s, selectedGapSkill: skill }));
  const setTargetJobTitle = (title: string) => setState((s) => ({ ...s, targetJobTitle: title }));
  const setMagicModeData = (data: any) => setState((s) => ({ ...s, magicModeData: data }));
  
  const resetWizard = () => setState(s => ({ 
    ...initialState, 
    taxonomy: s.taxonomy, 
    isTaxonomyLoading: s.isTaxonomyLoading,
    taxonomyError: s.taxonomyError 
  }));

  return (
    <WizardContext.Provider
      value={{
        ...state,
        setStep,
        setProfileName,
        setSkills,
        updateSkillEvidence,
        setStudentId,
        setAnalysisResult,
        setSelectedGapSkill,
        setTargetJobTitle,
        setMagicModeData,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};
