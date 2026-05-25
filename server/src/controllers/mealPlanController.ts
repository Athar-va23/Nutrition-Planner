import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { mealPlanService, MealPlanService } from '../services/MealPlanService';
import { AuthenticatedRequest } from '../middleware/auth';

export class MealPlanController extends BaseController {
  constructor(private readonly service: MealPlanService) {
    super();
  }

  async listMealPlans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.service.listMealPlans(userId, page, limit);
      
      this.handleSuccess(res, {
        mealPlans: result.mealPlans,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      this.handleError(error, res, 'listMealPlans');
    }
  }

  async getMealPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const mealPlan = await this.service.getMealPlan(id, userId);
      this.handleSuccess(res, { mealPlan });
    } catch (error) {
      this.handleError(error, res, 'getMealPlan');
    }
  }

  async createMealPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { duration, startDate, preferences } = req.body;

      if (!duration || !startDate) {
        return this.handleError(
          new Error('Missing required fields: duration and startDate'),
          res,
          'createMealPlan'
        );
      }
      
      const mealPlan = await this.service.createMealPlan(userId, duration, startDate, preferences);
      this.handleSuccess(res, { mealPlan }, 201);
    } catch (error) {
      this.handleError(error, res, 'createMealPlan');
    }
  }

  async deleteMealPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      await this.service.deleteMealPlan(id, userId);
      this.handleSuccess(res, { message: 'Meal plan deleted successfully' });
    } catch (error) {
      this.handleError(error, res, 'deleteMealPlan');
    }
  }
}

export const mealPlanController = new MealPlanController(mealPlanService);
