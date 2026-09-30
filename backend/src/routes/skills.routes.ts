import { Router } from 'express';
import { SkillsRepository } from '../data/skills.repo';
import { sendSuccess, sendError } from '../utils/response';

const skillsRouter = Router();
const skillsRepo = new SkillsRepository();

skillsRouter.get('/', (_req, res) => {
  try {
    const skills = skillsRepo.getAllSkills();
    return sendSuccess(res, { skills }, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Internal Server Error', 500);
  }
});

export { skillsRouter };
