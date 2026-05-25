import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { isDatabaseAvailable, prisma } from '../utils/dbCheck';
import { toJsonArray } from '../utils/jsonArray';

// Grocery categories for grouping items
const GROCERY_CATEGORIES = [
  { name: 'Produce', keywords: ['vegetable', 'fruit', 'herb', 'lettuce', 'spinach', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'pepper', 'apple', 'banana', 'berry', 'citrus', 'leafy'] },
  { name: 'Proteins', keywords: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'egg', 'meat', 'seafood', 'turkey', 'lamb', 'sausage', 'bacon'] },
  { name: 'Dairy', keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy', 'cheddar', 'mozzarella', 'parmesan', 'feta'] },
  { name: 'Grains', keywords: ['rice', 'pasta', 'bread', 'flour', 'oats', 'cereal', 'quinoa', 'couscous', 'noodle', 'tortilla', 'grain'] },
  { name: 'Pantry', keywords: ['oil', 'vinegar', 'sauce', 'spice', 'herb', 'seasoning', 'sugar', 'salt', 'pepper', 'honey', 'syrup', 'can', 'jar', 'condiment'] },
  { name: 'Frozen', keywords: ['frozen', 'ice cream', 'frozen vegetable', 'frozen fruit'] },
  { name: 'Beverages', keywords: ['juice', 'water', 'soda', 'coffee', 'tea', 'drink', 'beverage'] },
  { name: 'Other', keywords: [] },
];

function categorizeIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  for (const category of GROCERY_CATEGORIES) {
    if (category.keywords.some(keyword => lowerName.includes(keyword))) {
      return category.name;
    }
  }
  
  return 'Other';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const groceryController = {
  async getGroceryLists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        return res.json({
          success: true,
          data: {
            groceryLists: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          },
        });
      }

      const skip = (page - 1) * limit;

      const [groceryLists, total] = await Promise.all([
        prisma.groceryList.findMany({
          where: { userId },
          orderBy: { generatedAt: 'desc' },
          skip,
          take: limit,
          include: {
            mealPlan: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                categories: {
                  select: {
                    items: true,
                  },
                },
              },
            },
          },
        }),
        prisma.groceryList.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: {
          groceryLists,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getGroceryList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        throw new AppError('SERVICE_UNAVAILABLE', 503, 'Database is not available');
      }

      const groceryList = await prisma.groceryList.findFirst({
        where: { id, userId },
        include: {
          categories: {
            include: {
              items: {
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          mealPlan: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!groceryList) {
        throw new AppError('NOT_FOUND', 404, 'Grocery list not found');
      }

      res.json({
        success: true,
        data: { groceryList },
      });
    } catch (error) {
      next(error);
    }
  },

  async generateGroceryList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { mealPlanId, options } = req.body;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        throw new AppError('SERVICE_UNAVAILABLE', 503, 'Database is required to generate grocery lists');
      }

      // Get the meal plan with all meals and ingredients
      const mealPlan = await prisma.mealPlan.findFirst({
        where: { id: mealPlanId, userId },
        include: {
          planMeals: {
            include: {
              meal: {
                include: {
                  ingredients: true,
                },
              },
            },
          },
        },
      });

      if (!mealPlan) {
        throw new AppError('NOT_FOUND', 404, 'Meal plan not found');
      }

      // Aggregate ingredients from all meals
      const ingredientMap = new Map<string, { amount: number; unit: string; recipes: string[] }>();

      for (const planMeal of mealPlan.planMeals) {
        const meal = planMeal.meal;
        const servingsMultiplier = options?.servingsMultiplier || 1;

        for (const ingredient of meal.ingredients) {
          const key = ingredient.name.toLowerCase();
          const existing = ingredientMap.get(key);

          if (existing) {
            if (existing.unit === ingredient.unit) {
              existing.amount += ingredient.amount * servingsMultiplier;
            }
            if (!existing.recipes.includes(meal.name)) {
              existing.recipes.push(meal.name);
            }
          } else {
            ingredientMap.set(key, {
              amount: ingredient.amount * servingsMultiplier,
              unit: ingredient.unit,
              recipes: [meal.name],
            });
          }
        }
      }

      // Group ingredients by category
      const categorizedItems = new Map<string, Array<{ name: string; amount: number; unit: string; recipes: string[] }>>();

      for (const [name, data] of ingredientMap) {
        const category = options?.groupByCategory !== false ? categorizeIngredient(name) : 'All Items';
        
        if (!categorizedItems.has(category)) {
          categorizedItems.set(category, []);
        }
        
        categorizedItems.get(category)!.push({
          name: capitalizeFirst(name),
          amount: Math.round(data.amount * 10) / 10,
          unit: data.unit,
          recipes: data.recipes,
        });
      }

      // Create grocery list in database
      const groceryList = await prisma.$transaction(async (tx) => {
        // Delete existing grocery list for this meal plan if exists
        await tx.groceryList.deleteMany({
          where: { mealPlanId },
        });

        // Create new grocery list
        const newList = await tx.groceryList.create({
          data: {
            userId,
            mealPlanId,
            name: `Shopping List - ${mealPlan.name}`,
            categories: {
              create: Array.from(categorizedItems.entries()).map(([name, items]) => {
                const categoryIndex = GROCERY_CATEGORIES.findIndex(c => c.name === name);
                return {
                  name,
                  sortOrder: categoryIndex !== -1 ? categoryIndex : GROCERY_CATEGORIES.length + Array.from(categorizedItems.keys()).indexOf(name),
                  items: {
                    create: items.map(item => ({
                      name: item.name,
                      amount: item.amount,
                      unit: item.unit,
                      recipes: toJsonArray(item.recipes),
                    })),
                  },
                };
              }),
            },
          },
          include: {
            categories: {
              include: {
                items: true,
              },
            },
          },
        });

        return newList;
      });

      logger.info(`Grocery list generated: ${groceryList.id} for meal plan: ${mealPlanId}`);

      res.status(201).json({
        success: true,
        data: { groceryList },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { listId, itemId } = req.params;
      const { checked } = req.body;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        throw new AppError('SERVICE_UNAVAILABLE', 503, 'Database is not available');
      }

      const groceryList = await prisma.groceryList.findFirst({
        where: { id: listId, userId },
      });

      if (!groceryList) {
        throw new AppError('NOT_FOUND', 404, 'Grocery list not found');
      }

      const item = await prisma.groceryItem.update({
        where: { id: itemId },
        data: { checked },
      });

      res.json({
        success: true,
        data: { item },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteGroceryList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        throw new AppError('SERVICE_UNAVAILABLE', 503, 'Database is not available');
      }

      const groceryList = await prisma.groceryList.findFirst({
        where: { id, userId },
      });

      if (!groceryList) {
        throw new AppError('NOT_FOUND', 404, 'Grocery list not found');
      }

      await prisma.groceryList.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: 'Grocery list deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  },
};
