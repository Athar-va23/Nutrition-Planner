import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();

// All AI routes are protected
router.use(authenticate);

router.post(
  '/chat', 
  aiLimiter,
  asyncErrorWrapper((req: any, res: any, next: any) => aiController.chat(req, res, next))
);

router.get(
  '/insights', 
  aiLimiter,
  asyncErrorWrapper((req: any, res: any, next: any) => aiController.getInsights(req, res, next))
);

export default router;
