/**
 * Tutor routes — POST /api/tutor/explain
 *
 * Accepts a skill name, explanation style, and optional evidence level.
 * Returns an AI-generated or fallback explanation.
 */

import { Router, Request, Response } from 'express';
import { TutorService } from '../services/tutor.service';
import { VALID_STYLES, VALID_EVIDENCE_LEVELS, ExplanationStyle, EvidenceLevel } from '../ai/schema-validator';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const tutorService = new TutorService();

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { skillName, style, evidenceLevel } = req.body;

    // --- Validate skillName ---
    if (!skillName || typeof skillName !== 'string' || skillName.trim().length === 0) {
      return sendError(res, 'Missing or empty "skillName" in request body.', 400);
    }

    // --- Validate style ---
    if (!style || typeof style !== 'string') {
      return sendError(
        res,
        `Missing "style" in request body. Must be one of: ${VALID_STYLES.join(', ')}`,
        400
      );
    }

    if (!VALID_STYLES.includes(style as ExplanationStyle)) {
      return sendError(
        res,
        `Invalid style: "${style}". Must be one of: ${VALID_STYLES.join(', ')}`,
        400
      );
    }

    // --- Validate evidenceLevel (optional, defaults to 'none') ---
    const evLevel: EvidenceLevel =
      evidenceLevel && VALID_EVIDENCE_LEVELS.includes(evidenceLevel)
        ? evidenceLevel
        : 'none';

    // --- Generate explanation ---
    const explanation = await tutorService.explain(
      skillName.trim(),
      style as ExplanationStyle,
      evLevel
    );

    return sendSuccess(res, explanation, 200);
  } catch (err: any) {
    console.error('[tutor-route] Unexpected error:', err);
    return sendError(res, 'Internal server error', 500);
  }
});

export { router as tutorRouter };
