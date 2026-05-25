import { mealPlanRepository, MealPlanRepository } from '../repositories/MealPlanRepository';
import { LLMService } from './ai/llmService';
import { AppError } from '../middleware/errorHandler';

export class MealPlanService {
  private llmService = new LLMService();

  constructor(private readonly repo: MealPlanRepository) {}

  async listMealPlans(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.repo.listByUser(userId, skip, limit);
  }

  async getMealPlan(id: string, userId: string) {
    const mealPlan = await this.repo.findByIdAndUser(id, userId);
    if (!mealPlan) throw new AppError('NOT_FOUND', 404, 'Meal plan not found');

    // Group meals by day
    const daysMap = new Map();
    mealPlan.planMeals.forEach((planMeal) => {
      if (!daysMap.has(planMeal.dayNumber)) {
        daysMap.set(planMeal.dayNumber, {
          dayNumber: planMeal.dayNumber,
          meals: [],
        });
      }
      daysMap.get(planMeal.dayNumber).meals.push({
        type: planMeal.mealType,
        ...planMeal.meal,
      });
    });

    return {
      ...mealPlan,
      days: Array.from(daysMap.values()),
      planMeals: undefined,
    };
  }

  async createMealPlan(userId: string, duration: string, startDate: string, preferences: any) {
    const aiResult = await this.llmService.generateMealPlan(
      userId,
      duration as any,
      startDate,
      preferences
    );

    if (!aiResult.mealPlan) {
      throw new AppError('AI_SERVICE_ERROR', 502, 'Failed to generate meal plan');
    }

    const aiMealPlan = aiResult.mealPlan;
    const start = new Date(startDate);
    const daysCount = duration === 'daily' ? 1 : duration === 'weekly' ? 7 : 14;
    const end = new Date(start);
    end.setDate(end.getDate() + daysCount - 1);

    return this.repo.createWithMeals(userId, aiMealPlan, start, end, duration, preferences);
  }

  async deleteMealPlan(id: string, userId: string) {
    const deleted = await this.repo.deletePlan(id, userId);
    if (!deleted) throw new AppError('NOT_FOUND', 404, 'Meal plan not found');
    return true;
  }
}

export const mealPlanService = new MealPlanService(mealPlanRepository);
