import { Router } from 'express';
import { AnalysisService } from '../services/analysis.service';
import { RoadmapService } from '../services/roadmap.service';
import { RolesRepository } from '../data/roles.repo';
import { ProfileRepository } from '../data/profile.repo';
import { AnalysisRepository } from '../data/analysis.repo';
import { sendSuccess, sendError } from '../utils/response';
import { validateAnalysisBody } from '../validation/schemas';

const analysisRouter = Router();

// Dependency Injection setup (in a real app, use a DI container, doing it manually here)
const rolesRepo = new RolesRepository();
const profileRepo = new ProfileRepository();
const analysisRepo = new AnalysisRepository();
const roadmapService = new RoadmapService(rolesRepo);
const analysisService = new AnalysisService(rolesRepo, profileRepo, analysisRepo, roadmapService);

analysisRouter.post('/', (req, res) => {
  try {
    const errorMsg = validateAnalysisBody(req.body);
    if (errorMsg) {
      return sendError(res, errorMsg, 400);
    }

    const { studentId, roleName } = req.body;
    
    const result = analysisService.runAnalysis(studentId, roleName);
    
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    if (error.message.includes('Role not found')) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, error.message || 'Internal Server Error', 500);
  }
});

export { analysisRouter };
