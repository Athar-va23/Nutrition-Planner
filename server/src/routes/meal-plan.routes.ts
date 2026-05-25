import { Router } from 'express';
import { mealPlanController } from '../controllers/mealPlanController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { validate, createMealPlanSchema } from '../middleware/validation';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();

router.use(authenticate);

router.get(
  '/', 
  asyncErrorWrapper((req: any, res: any, next: any) => mealPlanController.listMealPlans(req, res, next))
);

router.post(
  '/', 
  aiLimiter, 
  validate(createMealPlanSchema),
  asyncErrorWrapper((req: any, res: any, next: any) => mealPlanController.createMealPlan(req, res, next))
);

router.get(
  '/:id', 
  asyncErrorWrapper((req: any, res: any, next: any) => mealPlanController.getMealPlan(req, res, next))
);

router.delete(
  '/:id', 
  asyncErrorWrapper((req: any, res: any, next: any) => mealPlanController.deleteMealPlan(req, res, next))
);

export default router;
