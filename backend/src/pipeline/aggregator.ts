/**
 * Skill frequency aggregation for role requirements.
 *
 * Takes the per-posting skill extractions and computes:
 *   - frequency: how many postings mention each skill
 *   - weight:    frequency / totalPostings  (0.0–1.0)
 *
 * This is a pure, deterministic computation — no LLM, no heuristics.
 * The same inputs always produce the same outputs.
 */

import { SkillFrequency, RoleRequirement } from '../types';
import { ExtractionResult } from './skill-extractor';

/**
 * Computes skill frequencies from a set of per-posting extraction results.
 *
 * @param extractions - Map from posting index to that posting's extracted skills
 * @param totalPostings - Total number of postings in the dataset
 * @returns Array of SkillFrequency, sorted by weight descending
 */
export function computeSkillFrequencies(
  extractions: Map<number, ExtractionResult[]>,
  totalPostings: number
): SkillFrequency[] {
  if (totalPostings <= 0) {
    throw new Error(`totalPostings must be > 0, got ${totalPostings}`);
  }

  // Count how many postings mention each skill
  const frequencyMap = new Map<number, { skillName: string; count: number }>();

  for (const [, results] of extractions) {
    // Each skill is already deduplicated per posting by the extractor
    for (const result of results) {
      const existing = frequencyMap.get(result.skillIndex);
      if (existing) {
        existing.count += 1;
      } else {
        frequencyMap.set(result.skillIndex, {
          skillName: result.skillName,
          count: 1,
        });
      }
    }
  }

  // Convert to SkillFrequency array with normalized weights
  const frequencies: SkillFrequency[] = [];

  for (const [skillIndex, { skillName, count }] of frequencyMap) {
    frequencies.push({
      skillId: skillIndex,  // Will be remapped to DB IDs during seeding
      skillName,
      frequency: count,
      weight: roundWeight(count / totalPostings),
    });
  }

  // Sort by weight descending, then alphabetically for stable ordering
  frequencies.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.skillName.localeCompare(b.skillName);
  });

  return frequencies;
}

/**
 * Converts skill frequencies to role requirements.
 *
 * @param frequencies - Output of computeSkillFrequencies()
 * @param roleName - The role these requirements are for
 * @param totalPostings - Total number of postings analyzed
 * @param dbSkillIdMap - Maps taxonomy index → database skill ID
 * @returns Array of RoleRequirement ready for DB insertion
 */
export function buildRoleRequirements(
  frequencies: SkillFrequency[],
  roleName: string,
  totalPostings: number,
  dbSkillIdMap: Map<number, number>
): RoleRequirement[] {
  return frequencies.map((freq) => ({
    roleName,
    skillId: dbSkillIdMap.get(freq.skillId) ?? freq.skillId,
    skillName: freq.skillName,
    frequency: freq.frequency,
    weight: freq.weight,
    totalPostings,
  }));
}

/**
 * Round weight to 4 decimal places to avoid floating point noise.
 */
function roundWeight(w: number): number {
  return Math.round(w * 10000) / 10000;
}
