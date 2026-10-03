/**
 * Job Match API — matches student skills against individual job postings.
 *
 * GET  /api/postings           — list all postings with their required skills
 * POST /api/postings/match     — match a set of student skills against all postings
 */

import { Router } from 'express';
import { getDatabase } from '../db/connection';
import { sendSuccess, sendError } from '../utils/response';

const postingsRouter = Router();

/** Shape of a posting with its extracted skills. */
interface PostingWithSkills {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  source_label: 'real' | 'sample';
  source_name: string;
  date_posted: string | null;
  skills: { id: number; name: string; category: string }[];
}

/** Shape of a match result for a single posting. */
interface PostingMatch {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  source_label: 'real' | 'sample';
  source_name: string;
  date_posted: string | null;
  totalSkills: number;
  matchedSkills: { id: number; name: string; category: string }[];
  missingSkills: { id: number; name: string; category: string }[];
  matchPercent: number;
}

/**
 * GET /api/postings
 * Returns all job postings with their extracted skills.
 * Only returns postings that have at least one extracted skill.
 */
postingsRouter.get('/', (_req, res) => {
  try {
    const db = getDatabase();

    const postings = db.prepare(`
      SELECT id, title, company, location, source_label, source_name, date_posted
      FROM job_postings
      ORDER BY id
    `).all() as Array<{
      id: number; title: string; company: string | null;
      location: string | null; source_label: 'real' | 'sample';
      source_name: string; date_posted: string | null;
    }>;

    const skillLinks = db.prepare(`
      SELECT ps.posting_id, s.id, s.name AS name, s.category
      FROM posting_skills ps
      JOIN skills s ON s.id = ps.skill_id
      ORDER BY ps.posting_id, s.name
    `).all() as Array<{
      posting_id: number; id: number; name: string; category: string;
    }>;

    // Group skills by posting
    const skillsByPosting = new Map<number, { id: number; name: string; category: string }[]>();
    for (const link of skillLinks) {
      const arr = skillsByPosting.get(link.posting_id) ?? [];
      arr.push({ id: link.id, name: link.name, category: link.category });
      skillsByPosting.set(link.posting_id, arr);
    }

    // Only return postings that have skills (useful for matching)
    const result: PostingWithSkills[] = postings
      .filter(p => skillsByPosting.has(p.id))
      .map(p => ({
        ...p,
        skills: skillsByPosting.get(p.id) ?? [],
      }));

    return sendSuccess(res, { postings: result });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch postings', 500);
  }
});

/**
 * POST /api/postings/match
 *
 * Body: { skillNames: string[], evidenceMap?: Record<string, string> }
 *   - skillNames: list of skill names the student has declared
 *   - evidenceMap: optional mapping of skillName → evidenceType
 *     ('self_declared' | 'course' | 'project' | 'certificate')
 *
 * Returns all postings with match scores based on the student's skills.
 * Sorted by matchPercent descending so best matches appear first.
 */
postingsRouter.post('/match', (req, res) => {
  try {
    const { skillNames } = req.body as {
      skillNames?: string[];
    };

    if (!skillNames || !Array.isArray(skillNames) || skillNames.length === 0) {
      return sendError(res, 'skillNames must be a non-empty array of skill names', 400);
    }

    const db = getDatabase();

    // Normalize student skill names to lowercase for comparison
    const studentSkillsLower = new Set(skillNames.map(s => s.toLowerCase().trim()));

    // Get all postings with their skills
    const postings = db.prepare(`
      SELECT id, title, company, location, source_label, source_name, date_posted
      FROM job_postings
      ORDER BY id
    `).all() as Array<{
      id: number; title: string; company: string | null;
      location: string | null; source_label: 'real' | 'sample';
      source_name: string; date_posted: string | null;
    }>;

    const skillLinks = db.prepare(`
      SELECT ps.posting_id, s.id, s.name AS name, s.category
      FROM posting_skills ps
      JOIN skills s ON s.id = ps.skill_id
    `).all() as Array<{
      posting_id: number; id: number; name: string; category: string;
    }>;

    // Group skills by posting
    const skillsByPosting = new Map<number, { id: number; name: string; category: string }[]>();
    for (const link of skillLinks) {
      const arr = skillsByPosting.get(link.posting_id) ?? [];
      arr.push({ id: link.id, name: link.name, category: link.category });
      skillsByPosting.set(link.posting_id, arr);
    }

    // Calculate match for each posting
    const matches: PostingMatch[] = [];

    for (const posting of postings) {
      const postingSkills = skillsByPosting.get(posting.id);
      if (!postingSkills || postingSkills.length === 0) continue;

      const matched: { id: number; name: string; category: string }[] = [];
      const missing: { id: number; name: string; category: string }[] = [];

      for (const skill of postingSkills) {
        if (studentSkillsLower.has(skill.name.toLowerCase())) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      }

      const matchPercent = Math.round((matched.length / postingSkills.length) * 100);

      matches.push({
        ...posting,
        totalSkills: postingSkills.length,
        matchedSkills: matched,
        missingSkills: missing,
        matchPercent,
      });
    }

    // Sort by match percentage descending, then by total skills descending
    matches.sort((a, b) => {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
      return b.totalSkills - a.totalSkills;
    });

    return sendSuccess(res, { matches });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to match postings', 500);
  }
});

export { postingsRouter };
