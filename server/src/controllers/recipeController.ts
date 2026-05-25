import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { LLMService } from '../services/ai/llmService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const llmService = new LLMService();

export const recipeController = {
  async generateRecipe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { ingredients, preferences } = req.body;

      // Get user preferences for context
      const userPrefs = await prisma.userPreference.findUnique({
        where: { userId },
      });

      // Merge request preferences with user preferences
      const mergedPreferences = {
        cuisineType: preferences?.cuisineType,
        maxPrepTime: preferences?.maxPrepTime ?? userPrefs?.maxPrepTime ?? 30,
        servings: preferences?.servings || 2,
        mealType: preferences?.mealType,
      };

      // Generate recipes using AI
      const aiResult = await llmService.generateRecipe(ingredients, mergedPreferences);

      if (!aiResult.recipes || aiResult.recipes.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            recipes: [],
            message: 'No recipes could be generated with the provided ingredients',
          },
        });
      }

      logger.info(`Recipes generated for user: ${userId}`);

      res.json({
        success: true,
        data: {
          recipes: aiResult.recipes,
          suggestions: aiResult.suggestions || [],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async searchRecipes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const cuisine = req.query.cuisine as string;
      const maxPrepTime = parseInt(req.query.maxPrepTime as string) || undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        aiGenerated: true,
      };

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { ingredients: { some: { name: { contains: query, mode: 'insensitive' } } } },
        ];
      }

      if (cuisine) {
        where.cuisineType = cuisine;
      }

      if (maxPrepTime) {
        where.prepTimeMin = { lte: maxPrepTime };
      }

      const [recipes, total] = await Promise.all([
        prisma.meal.findMany({
          where,
          include: {
            ingredients: true,
            nutritionInfo: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.meal.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          recipes,
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
};
