/**
 * JSON schema validation for Anthropic model output.
 *
 * The model is instructed to return a specific JSON shape.  This module
 * validates that the response actually conforms before we use it.
 * If validation fails we log the reason and the caller falls through
 * to the deterministic fallback — no crash, no error to the user.
 */

export interface TutorResponse {
  skill: string;
  style: string;
  explanation_text: string;
  example?: string | null;
  notes?: string | null;
}

export const VALID_STYLES = ['simple', 'visual', 'example', 'step_by_step', 'arabic'] as const;
export type ExplanationStyle = (typeof VALID_STYLES)[number];

export const VALID_EVIDENCE_LEVELS = ['none', 'self_declared', 'course', 'project', 'certificate'] as const;
export type EvidenceLevel = (typeof VALID_EVIDENCE_LEVELS)[number];

/**
 * Attempt to parse raw text as JSON and validate it against the
 * TutorResponse schema.
 *
 * @returns The validated TutorResponse, or null if validation failed.
 */
export function validateTutorResponse(raw: string): TutorResponse | null {
  let parsed: any;

  try {
    // Strip markdown code fences if Claude includes them
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      // Find the end of the first line (e.g. ```json)
      const firstNewline = cleaned.indexOf('\n');
      if (firstNewline !== -1) {
        cleaned = cleaned.substring(firstNewline + 1);
      }
      // Remove trailing ```
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
    }
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    console.warn(`[tutor-schema] Failed to parse AI response as JSON: ${err.message}`);
    return null;
  }

  // --- Required fields ---
  if (typeof parsed.skill !== 'string' || parsed.skill.trim().length === 0) {
    console.warn('[tutor-schema] Missing or empty "skill" field');
    return null;
  }

  if (typeof parsed.style !== 'string' || parsed.style.trim().length === 0) {
    console.warn('[tutor-schema] Missing or empty "style" field');
    return null;
  }

  if (typeof parsed.explanation_text !== 'string' || parsed.explanation_text.trim().length < 50) {
    console.warn(
      '[tutor-schema] "explanation_text" must be a string with ≥50 characters, got:',
      typeof parsed.explanation_text === 'string'
        ? `${parsed.explanation_text.length} chars`
        : typeof parsed.explanation_text
    );
    return null;
  }

  // --- Optional fields ---
  const example =
    parsed.example === undefined || parsed.example === null
      ? null
      : typeof parsed.example === 'string'
        ? parsed.example
        : null; // wrong type → silently drop

  const notes =
    parsed.notes === undefined || parsed.notes === null
      ? null
      : typeof parsed.notes === 'string'
        ? parsed.notes
        : null;

  return {
    skill: parsed.skill.trim(),
    style: parsed.style.trim(),
    explanation_text: parsed.explanation_text.trim(),
    example,
    notes,
  };
}
