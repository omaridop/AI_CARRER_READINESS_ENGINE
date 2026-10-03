/**
 * Shared type definitions for the SkillBridge backend.
 * Used across the data layer, pipeline, and API.
 */

// ===== Skills Taxonomy =====

export interface SkillDefinition {
  name: string;            // Canonical skill name (e.g., "Power BI")
  category: SkillCategory;
  aliases: string[];       // Alternative names/spellings that map to this skill
}

export type SkillCategory =
  | 'programming'
  | 'analytics'
  | 'data'
  | 'statistics'
  | 'tools'
  | 'soft_skill';

// ===== Job Postings =====

export interface JobPostingData {
  title: string;
  company: string;
  location: string;
  source_label: 'real' | 'sample';
  source_name: string;     // e.g., "Bayt.com", "LinkedIn", "synthetic"
  description: string;     // Full posting text
  date_posted: string | null;
}

// ===== Pipeline Outputs =====

export interface ExtractedSkill {
  postingId: number;
  skillId: number;
}

export interface SkillFrequency {
  skillId: number;
  skillName: string;
  frequency: number;       // Number of postings mentioning this skill
  weight: number;          // frequency / totalPostings (0.0–1.0)
}

export interface RoleRequirement {
  roleName: string;
  skillId: number;
  skillName: string;
  frequency: number;
  weight: number;
  totalPostings: number;
}

// ===== Database Row Types =====

export interface SkillRow {
  id: number;
  name: string;
  category: string;
  aliases: string;         // JSON string
}

export interface JobPostingRow {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  source_label: 'real' | 'sample';
  source_name: string;
  description: string;
  date_posted: string | null;
  created_at: string;
}

export interface PostingSkillRow {
  id: number;
  posting_id: number;
  skill_id: number;
}

export interface RoleRequirementRow {
  id: number;
  role_name: string;
  skill_id: number;
  frequency: number;
  weight: number;
  total_postings: number;
}
