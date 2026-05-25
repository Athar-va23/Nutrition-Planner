import { prisma } from '../utils/dbCheck';
import { MealPlan, Prisma } from '@prisma/client';
import { toJsonArray } from '../utils/jsonArray';

export class MealPlanRepository {
  async listByUser(userId: string, skip: number, take: number) {
    const [mealPlans, total] = await Promise.all([
      prisma.mealPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          duration: true,
          startDate: true,
          totalCalories: true,
          aiGenerated: true,
          createdAt: true,
          _count: {
            select: { planMeals: true },
          },
        },
      }),
      prisma.mealPlan.count({ where: { userId } }),
    ]);

    return {
      mealPlans: mealPlans.map((plan) => ({
        ...plan,
        mealCount: plan._count.planMeals,
        _count: undefined,
      })),
      total,
    };
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.mealPlan.findFirst({
      where: { id, userId },
      include: {
        planMeals: {
          include: {
            meal: {
              include: {
                ingredients: true,
                nutritionInfo: true,
              },
            },
          },
          orderBy: [{ dayNumber: 'asc' }, { mealType: 'asc' }],
        },
      },
    });
  }

  async createWithMeals(userId: string, data: any, start: Date, end: Date, duration: string, preferences?: any) {
    return prisma.$transaction(async (tx) => {
      const newMealPlan = await tx.mealPlan.create({
        data: {
          userId,
          name: data.name,
          duration,
          startDate: start,
          endDate: end,
          totalCalories: data.totalCalories,
          aiGenerated: true,
        },
      });

      for (const day of data.days) {
        for (const mealData of day.meals) {
          const meal = await tx.meal.create({
            data: {
              name: mealData.name,
              description: mealData.description,
              instructions: toJsonArray(mealData.instructions),
              prepTimeMin: mealData.prepTime,
              cookTimeMin: mealData.cookTime,
              servings: mealData.servings,
              cuisineType: preferences?.cuisineTypes?.[0],
              aiGenerated: true,
              ingredients: {
                create: mealData.ingredients.map((ing: any) => ({
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                })),
              },
              nutritionInfo: {
                create: {
                  calories: mealData.calories,
                  proteinG: mealData.nutrition.protein,
                  carbsG: mealData.nutrition.carbs,
                  fatG: mealData.nutrition.fat,
                  fiberG: mealData.nutrition.fiber,
                },
              },
            },
          });

          await tx.planMeal.create({
            data: {
              planId: newMealPlan.id,
              mealId: meal.id,
              dayNumber: day.dayNumber,
              mealType: mealData.type,
            },
          });
        }
      }

      return newMealPlan;
    });
  }

  async deletePlan(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const mealPlan = await tx.mealPlan.findFirst({
        where: { id, userId },
      });

      if (!mealPlan) return null;

      const planMeals = await tx.planMeal.findMany({
        where: { planId: id },
      });
      const mealIds = planMeals.map((pm) => pm.mealId);

      await tx.planMeal.deleteMany({ where: { planId: id } });
      await tx.meal.deleteMany({ where: { id: { in: mealIds } } });
      await tx.mealPlan.delete({ where: { id } });

      return true;
    });
  }
}

export const mealPlanRepository = new MealPlanRepository();
