import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();

router.post(
  '/register', 
  authLimiter, 
  asyncErrorWrapper((req: any, res: any, next: any) => authController.register(req, res, next))
);

router.post(
  '/login', 
  authLimiter, 
  asyncErrorWrapper((req: any, res: any, next: any) => authController.login(req, res, next))
);

router.post(
  '/refresh', 
  asyncErrorWrapper((req: any, res: any, next: any) => authController.refresh(req, res, next))
);

router.post(
  '/logout', 
  asyncErrorWrapper((req: any, res: any, next: any) => authController.logout(req, res, next))
);

export default router;
