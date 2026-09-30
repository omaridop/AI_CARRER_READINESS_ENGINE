// HTTP response data after apiFetch unwraps the backend's { data, error } envelope.
export interface AnalysisResult {
  analysisId: number;
  readinessScore: number;
  gaps: { skillId: number; skillName: string; gapWeight: number; priorityRank: number }[];
  roadmap: {
    skillId: number;
    skillName: string;
    sequenceOrder: number;
    title: string;
    description: string;
    assessmentIdea: string;
    estimatedHours: number;
  }[];
}

export type ExplanationStyle = 'simple' | 'visual' | 'example' | 'step_by_step' | 'arabic';

export interface TutorResponse {
  skill: string;
  style: string;
  explanation_text: string;
  example: string | null;
  notes: string | null;
  source: 'ai' | 'fallback';
}
