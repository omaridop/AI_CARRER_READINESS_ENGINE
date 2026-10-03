import { Router } from 'express';
import { SkillsRepository } from '../data/skills.repo';
import { CourseSearchService } from '../services/course-search.service';
import { sendError, sendSuccess } from '../utils/response';

const coursesRouter = Router();
const skills = new SkillsRepository();
const search = new CourseSearchService();

coursesRouter.post('/search', async (req, res) => {
  const input: unknown = req.body?.skillName;
  if (typeof input !== 'string' || !input.trim() || input.length > 100) return sendError(res, 'Choose a recognized skill to research.', 400);
  try {
    const allSkills = skills.getAllSkills() as { name: string; aliases: string[] }[];
    const skill = allSkills.find(s => [s.name, ...s.aliases].some(name => name.toLowerCase() === input.trim().toLowerCase()));
    if (!skill) return sendError(res, 'This skill is not in the supported skill catalog.', 400);
    return sendSuccess(res, await search.find(skill.name, skill.aliases), 200);
  } catch {
    return sendError(res, 'Course research could not start. Please try again.', 500);
  }
});

export { coursesRouter };
