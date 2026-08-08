import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config/unifiedConfig';
import { buildMealPlanPrompt, buildRecipePrompt } from './prompts';
import { AICacheService } from './cacheService';
import { fromJsonArray } from '../../utils/jsonArray';

// Groq client (for fast chat/insights)
const groq = new Groq({
  apiKey: config.ai.groqKey || 'EMPTY_GROQ_KEY',
});

// OpenRouter client (for heavy generation)
const openRouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.ai.openRouterKey || 'EMPTY_OPENROUTER_KEY',
  defaultHeaders: {
    'HTTP-Referer': 'https://nutripro.ai',
    'X-Title': 'NutriPro AI',
  },
});

const prisma = new PrismaClient();
const cacheService = new AICacheService();

export interface UserProfile {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel: string;
  healthGoal: string;
  calorieTarget?: number;
}

export interface Preferences {
  dietaryTypes: string[];
  allergies: string[];
  restrictedFoods: string[];
  cuisinePreferences: string[];
  maxPrepTime?: number;
  mealsPerDay?: number;
}

export interface RecipePreferences {
  cuisineType?: string;
  maxPrepTime?: number;
  servings?: number;
  mealType?: string;
}

export class LLMService {
  /**
   * Generates a comprehensive meal plan using OpenRouter
   */
  async generateMealPlan(
    userId: string,
    duration: 'daily' | 'weekly' | 'biweekly',
    startDate: string,
    preferences?: any
  ) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const userPreferences = await prisma.userPreference.findUnique({ where: { userId } });

    if (!userProfile) throw new Error('User profile not found');

    const profile: UserProfile = {
      age: userProfile.age || undefined,
      gender: userProfile.gender || undefined,
      heightCm: userProfile.heightCm || undefined,
      weightKg: userProfile.weightKg || undefined,
      activityLevel: userProfile.activityLevel,
      healthGoal: userProfile.healthGoal,
      calorieTarget: userProfile.calorieTarget || undefined,
    };

    const prefs: Preferences = {
      dietaryTypes: fromJsonArray(userPreferences?.dietaryTypes),
      allergies: fromJsonArray(userPreferences?.allergies),
      restrictedFoods: fromJsonArray(userPreferences?.restrictedFoods),
      cuisinePreferences: fromJsonArray(userPreferences?.cuisinePreferences),
      maxPrepTime: preferences?.maxPrepTime || userPreferences?.maxPrepTime || 45,
      mealsPerDay: userPreferences?.mealsPerDay || 3,
    };

    const cacheKey = { userId, duration, startDate, preferences };
    const cached = await cacheService.getCachedResult<any>('mealPlan', cacheKey);
    if (cached) return cached;

    const prompt = buildMealPlanPrompt(profile, prefs, duration);

    // Using OpenRouter for high-quality generation
    const response = await openRouter.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist and meal planner AI. Create personalized, nutritionally balanced meal plans. Always respond in valid JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    await cacheService.cacheResult('mealPlan', cacheKey, result, 86400);

    return result;
  }

  /**
   * Generates a creative recipe based on ingredients using OpenRouter
   */
  async generateRecipe(ingredients: string[], preferences: RecipePreferences) {
    const cacheKey = { ingredients, preferences };
    const cached = await cacheService.getCachedResult<any>('recipe', cacheKey);
    if (cached) return cached;

    const prompt = buildRecipePrompt(ingredients, preferences);

    const response = await openRouter.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a creative chef AI that generates delicious recipes from available ingredients. Always respond in valid JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    await cacheService.cacheResult('recipe', cacheKey, result, 86400);

    return result;
  }

  /**
   * Real-time chat assistant using Groq (for speed)
   */
  async chat(userId: string, message: string, history: { role: string; content: string }[] = []) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const userPreferences = await prisma.userPreference.findUnique({ where: { userId } });

    const systemPrompt = `You are NutriAI, a premium nutrition and health assistant. 
    User Profile: ${JSON.stringify(userProfile)}
    User Preferences: ${JSON.stringify(userPreferences)}
    Be concise, helpful, and professional. Provide actionable nutritional advice.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-5),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  }

  /**
   * Automated health insights using Groq (for speed)
   */
  async generateInsights(userId: string) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const mealPlans = await prisma.mealPlan.findMany({ 
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { planMeals: { include: { meal: { include: { nutritionInfo: true } } } } }
    });

    const systemPrompt = `Analyze the user's data and provide 3 short, actionable nutritional insights. 
    Return as JSON: { "insights": [{ "title": "string", "description": "string", "type": "info|warning|success" }] }`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context: ${JSON.stringify({ profile: userProfile, plan: mealPlans[0] })}` },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{"insights": []}');
  }
}
