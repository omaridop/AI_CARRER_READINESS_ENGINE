import { Router } from 'express';
import { RolesRepository } from '../data/roles.repo';
import { sendSuccess, sendError } from '../utils/response';

const rolesRouter = Router();
const rolesRepo = new RolesRepository();

rolesRouter.get('/:roleName/requirements', (req, res) => {
  try {
    const roleName = req.params.roleName;
    const reqs = rolesRepo.getRoleRequirements(roleName);
    
    if (!reqs || reqs.length === 0) {
      return sendError(res, `No requirements found for role: ${roleName}`, 404);
    }
    
    return sendSuccess(res, reqs);
  } catch (error: any) {
    return sendError(res, error.message || 'Internal Server Error', 500);
  }
});

export { rolesRouter };
