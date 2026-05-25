import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate, userProfileSchema, userPreferencesSchema } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(userProfileSchema), userController.updateProfile);
router.get('/preferences', userController.getPreferences);
router.put('/preferences', validate(userPreferencesSchema), userController.updatePreferences);

export default router;
