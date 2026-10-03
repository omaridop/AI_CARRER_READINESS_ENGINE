import { Router } from 'express';
import { ProfileRepository } from '../data/profile.repo';
import { sendSuccess, sendError } from '../utils/response';
import { validateProfileBody } from '../validation/schemas';

const profileRouter = Router();
const profileRepo = new ProfileRepository();

profileRouter.post('/', (req, res) => {
  try {
    const errorMsg = validateProfileBody(req.body);
    if (errorMsg) {
      return sendError(res, errorMsg, 400);
    }
    
    const studentId = profileRepo.saveProfile(req.body);
    
    return sendSuccess(res, {
      studentId,
      message: 'Profile saved successfully'
    }, 201);
  } catch (error: any) {
    // Handle SQLite unique constraint errors or other DB errors gracefully
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return sendError(res, 'Duplicate skill entry for student', 400);
    }
    return sendError(res, error.message || 'Internal Server Error', 500);
  }
});

export { profileRouter };
