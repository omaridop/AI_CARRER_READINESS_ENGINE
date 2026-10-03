/**
 * Deterministic skill-extraction pipeline.
 *
 * Extracts skills from job posting text using regex-based keyword matching
 * against the canonical skills taxonomy.  Every match is traceable:
 *   posting text  →  matched alias  →  canonical skill id
 *
 * No LLM or probabilistic model is involved — this is fully deterministic
 * and reproducible given the same taxonomy and posting text.
 */

import { SkillDefinition } from '../types';

// ── Types ──────────────────────────────────────────────────

export interface SkillPattern {
  skillIndex: number;      // Index into the taxonomy array
  skillName: string;       // Canonical skill name
  pattern: RegExp;         // Compiled regex for this term
  originalTerm: string;    // The term this pattern was built from
}

export interface ExtractionResult {
  skillIndex: number;
  skillName: string;
  matchedTerms: string[];  // Which aliases/names actually matched
}

// ── Pattern Building ───────────────────────────────────────

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

/**
 * Builds a word-boundary regex pattern from a skill term.
 * Multi-word terms get flexible whitespace between words.
 * Handles special characters (e.g., "A/B Testing", "Power-BI").
 */
function buildTermPattern(term: string): RegExp {
  const escaped = escapeRegex(term.trim());
  // Allow flexible whitespace/hyphens between words
  const flexible = escaped.replace(/\s+/g, '[\\s\\-]+');
  return new RegExp(`\\b${flexible}\\b`, 'i');
}

/**
 * Builds an array of compiled regex patterns from the skills taxonomy.
 * Each canonical name + each alias gets its own pattern, all pointing
 * back to the same skill index.
 */
export function buildSkillPatterns(taxonomy: SkillDefinition[]): SkillPattern[] {
  const patterns: SkillPattern[] = [];

  for (let i = 0; i < taxonomy.length; i++) {
    const skill = taxonomy[i];

    // Pattern for the canonical name
    patterns.push({
      skillIndex: i,
      skillName: skill.name,
      pattern: buildTermPattern(skill.name),
      originalTerm: skill.name,
    });

    // Patterns for each alias
    for (const alias of skill.aliases) {
      patterns.push({
        skillIndex: i,
        skillName: skill.name,
        pattern: buildTermPattern(alias),
        originalTerm: alias,
      });
    }
  }

  return patterns;
}

// ── Extraction ─────────────────────────────────────────────

/**
 * Extracts skills from a single job posting's text.
 *
 * Returns deduplicated results: each skill appears at most once,
 * but `matchedTerms` lists all the aliases/names that matched.
 *
 * @param text - The job posting description text
 * @param patterns - Pre-built patterns from buildSkillPatterns()
 * @returns Array of extracted skills with match details
 */
export function extractSkills(
  text: string,
  patterns: SkillPattern[]
): ExtractionResult[] {
  const resultMap = new Map<number, ExtractionResult>();

  for (const sp of patterns) {
    if (sp.pattern.test(text)) {
      const existing = resultMap.get(sp.skillIndex);
      if (existing) {
        existing.matchedTerms.push(sp.originalTerm);
      } else {
        resultMap.set(sp.skillIndex, {
          skillIndex: sp.skillIndex,
          skillName: sp.skillName,
          matchedTerms: [sp.originalTerm],
        });
      }
    }
  }

  return Array.from(resultMap.values());
}

// ── Alias Normalization ────────────────────────────────────

/**
 * Given an alias string, returns the canonical skill name it maps to,
 * or null if no match is found.
 *
 * This is a lookup function (not regex-based) for explicit alias
 * resolution — useful for testing and debugging.
 */
export function normalizeAlias(
  alias: string,
  taxonomy: SkillDefinition[]
): string | null {
  const lowerAlias = alias.toLowerCase().trim();

  for (const skill of taxonomy) {
    if (skill.name.toLowerCase() === lowerAlias) {
      return skill.name;
    }
    for (const a of skill.aliases) {
      if (a.toLowerCase() === lowerAlias) {
        return skill.name;
      }
    }
  }

  return null;
}

/**
 * Batch-extracts skills from multiple postings.
 * Returns a map from posting index to extraction results.
 */
export function extractSkillsFromPostings(
  postings: { text: string }[],
  taxonomy: SkillDefinition[]
): Map<number, ExtractionResult[]> {
  const patterns = buildSkillPatterns(taxonomy);
  const results = new Map<number, ExtractionResult[]>();

  for (let i = 0; i < postings.length; i++) {
    results.set(i, extractSkills(postings[i].text, patterns));
  }

  return results;
}
