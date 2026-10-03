/**
 * Tutor Service — orchestrates AI explanation generation with fallback.
 *
 * Flow:
 *   1. Build prompt for the requested skill + style + evidence level
 *   2. Call Claude via the Anthropic client
 *   3. Validate the JSON response against the TutorResponse schema
 *   4. If anything fails (no key, timeout, malformed JSON) → serve fallback
 *
 * The tutor NEVER influences the readiness score or gap ranking.
 * It is a purely educational output layer.
 */

import { callClaude } from '../ai/anthropic-client';
import { buildUserPrompt, SYSTEM_PROMPT } from '../ai/prompt-templates';
import { validateTutorResponse, TutorResponse, ExplanationStyle, EvidenceLevel } from '../ai/schema-validator';
import { getFallback } from '../ai/fallback-explanations';

export interface TutorExplanation extends TutorResponse {
  source: 'ai' | 'fallback';
}

export class TutorService {
  /**
   * Generate an explanation for a skill gap.
   *
   * @param skillName     - Canonical skill name from the taxonomy
   * @param style         - Explanation style
   * @param evidenceLevel - Student's current evidence level for this skill
   * @returns A TutorExplanation with `source` indicating if it came from AI or fallback
   */
  async explain(
    skillName: string,
    style: ExplanationStyle,
    evidenceLevel: EvidenceLevel = 'none'
  ): Promise<TutorExplanation> {
    // 1. Try the AI path
    try {
      const userPrompt = buildUserPrompt(style, skillName, evidenceLevel);
      const rawResponse = await callClaude(SYSTEM_PROMPT, userPrompt);

      if (rawResponse) {
        // 2. Validate the response
        const validated = validateTutorResponse(rawResponse);

        if (validated) {
          console.info(`[tutor-service] AI response validated for ${skillName}/${style}`);
          return { ...validated, source: 'ai' };
        } else {
          console.warn(`[tutor-service] AI response failed validation for ${skillName}/${style} — using fallback`);
        }
      } else {
        console.info(`[tutor-service] No AI response for ${skillName}/${style} — using fallback`);
      }
    } catch (err: any) {
      console.warn(`[tutor-service] AI call error for ${skillName}/${style}:`, err?.message ?? err);
    }

    // 3. Fallback path
    const fallback = getFallback(skillName, style);
    return { ...fallback, source: 'fallback' };
  }
}
