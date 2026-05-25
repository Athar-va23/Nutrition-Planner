import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
};

// User validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const userProfileSchema = z.object({
  body: z.object({
    age: z.number().int().min(13).max(120).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    heightCm: z.number().positive().max(300).optional(),
    weightKg: z.number().positive().max(500).optional(),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    healthGoal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'improve_health']).optional(),
    calorieTarget: z.number().int().min(800).max(8000).optional(),
  }),
});

export const userPreferencesSchema = z.object({
  body: z.object({
    dietaryTypes: z.array(z.string()).max(10).optional(),
    allergies: z.array(z.string()).max(50).optional(),
    restrictedFoods: z.array(z.string()).max(50).optional(),
    cuisinePreferences: z.array(z.string()).max(20).optional(),
    maxPrepTime: z.number().int().min(5).max(180).optional(),
    mealsPerDay: z.number().int().min(1).max(6).optional(),
  }),
});

// Meal plan validation schemas
export const createMealPlanSchema = z.object({
  body: z.object({
    duration: z.enum(['daily', 'weekly', 'biweekly']),
    startDate: z.string().datetime(),
    preferences: z.object({
      cuisineTypes: z.array(z.string()).optional(),
      mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])).optional(),
      excludeIngredients: z.array(z.string()).optional(),
      maxPrepTime: z.number().int().min(5).max(180).optional(),
    }).optional(),
  }),
});

// Recipe validation schemas
export const generateRecipeSchema = z.object({
  body: z.object({
    ingredients: z.array(z.string()).min(1).max(20),
    preferences: z.object({
      cuisineType: z.string().optional(),
      maxPrepTime: z.number().int().optional(),
      servings: z.number().int().min(1).max(12).optional(),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    }).optional(),
  }),
});

// Grocery list validation schemas
export const generateGroceryListSchema = z.object({
  body: z.object({
    mealPlanId: z.string().uuid(),
    options: z.object({
      groupByCategory: z.boolean().optional(),
      includePantryItems: z.boolean().optional(),
      servingsMultiplier: z.number().min(0.5).max(5).optional(),
    }).optional(),
  }),
});

// Image validation schemas
export const detectIngredientsSchema = z.object({
  body: z.object({
    imageUrl: z.string().url(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
  }),
});
