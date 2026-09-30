/**
 * Prompt templates for the Adaptive Tutor.
 *
 * Each style gets its own user prompt, parameterized by:
 *   - skill:         canonical skill name from the taxonomy
 *   - evidenceLevel: human-readable description of the student's current level
 *
 * All prompts share the same system prompt and instruct the model to
 * return raw JSON (no markdown fences).
 */

import { ExplanationStyle, EvidenceLevel } from './schema-validator';

// ── Evidence level → human-readable phrase ────────────────────────

const EVIDENCE_PHRASES: Record<EvidenceLevel, string> = {
  none: 'no prior experience with this skill',
  self_declared: 'self-reported beginner-level familiarity (no formal training)',
  course: 'completed a course covering the fundamentals',
  project: 'completed a hands-on project using this skill',
  certificate: 'earned a professional certificate in this area',
};

export function evidenceToPhrase(level: EvidenceLevel): string {
  return EVIDENCE_PHRASES[level] ?? EVIDENCE_PHRASES.none;
}

// ── System prompt (shared across all styles) ──────────────────────

export const SYSTEM_PROMPT = `You are SkillBridge Tutor, an expert educator for aspiring Junior Data Analysts.
You explain data skills clearly and accurately.
You MUST respond with valid JSON only — no markdown fencing, no backticks, no extra text outside the JSON object.
CRITICAL: Do not use unescaped newlines inside JSON strings. If you need a line break, output the literal characters "\\n" instead of an actual newline.
Always include exactly these keys: "skill", "style", "explanation_text", "example", "notes".
Set "example" and "notes" to null if not applicable.`;

// ── Per-style user prompts ────────────────────────────────────────

const STYLE_PROMPTS: Record<ExplanationStyle, (skill: string, evidence: string) => string> = {
  simple: (skill, evidence) =>
    `Explain the skill "${skill}" to a student who currently has ${evidence}.
Use plain everyday language. Avoid jargon. Keep it under 200 words.
Respond ONLY with this JSON (no markdown):
{"skill":"${skill}","style":"simple","explanation_text":"...","example":null,"notes":null}`,

  visual: (skill, evidence) =>
    `Explain the skill "${skill}" to a student who currently has ${evidence}.
Use a spatial or structural metaphor — describe it as if drawing a diagram, using ASCII tables, flowcharts, or labeled boxes in text. Make the structure visible in words.
Respond ONLY with this JSON (no markdown):
{"skill":"${skill}","style":"visual","explanation_text":"...","example":null,"notes":null}`,

  example: (skill, evidence) =>
    `Explain the skill "${skill}" to a student who currently has ${evidence}.
Provide a concrete worked example with realistic sample data or a short code snippet.
The example should be something they could reproduce on their own computer.
Respond ONLY with this JSON (no markdown):
{"skill":"${skill}","style":"example","explanation_text":"...","example":"<your code or data example here>","notes":null}`,

  step_by_step: (skill, evidence) =>
    `Explain how to learn and apply the skill "${skill}" for a student who currently has ${evidence}.
Provide a numbered, sequential procedure (5-8 steps) they can follow this week to start building proficiency. Be specific and actionable.
Respond ONLY with this JSON (no markdown):
{"skill":"${skill}","style":"step_by_step","explanation_text":"...","example":null,"notes":"<any additional tips>"}`,

  arabic: (skill, evidence) =>
    `اشرح مهارة "${skill}" لطالب لديه حالياً ${evidence}.
استخدم لغة عربية فصحى بسيطة وواضحة. تجنب المصطلحات التقنية المعقدة ما أمكن.
أجب فقط بصيغة JSON التالية (بدون أي نص إضافي):
{"skill":"${skill}","style":"arabic","explanation_text":"...","example":null,"notes":null}`,
};

/**
 * Build the user prompt for a given style.
 */
export function buildUserPrompt(
  style: ExplanationStyle,
  skill: string,
  evidenceLevel: EvidenceLevel
): string {
  const evidencePhrase = evidenceToPhrase(evidenceLevel);
  return STYLE_PROMPTS[style](skill, evidencePhrase);
}
