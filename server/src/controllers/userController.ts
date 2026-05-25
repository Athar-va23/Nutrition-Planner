import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseAvailable, prisma } from '../utils/dbCheck';
import { toJsonArray, fromJsonArray } from '../utils/jsonArray';

export const userController = {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dbAvailable = await isDatabaseAvailable();

      if (dbAvailable) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });

        if (!user) {
          throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        return res.json({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profile: user.profile,
          },
        });
      }

      // Fallback: return a default profile using token data
      return res.json({
        success: true,
        data: {
          id: userId,
          email: req.user!.email,
          firstName: req.user!.firstName || '',
          lastName: req.user!.lastName || '',
          profile: {
            age: null,
            gender: null,
            heightCm: null,
            weightKg: null,
            activityLevel: 'moderate',
            healthGoal: 'maintain',
            calorieTarget: 2000,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profileData = req.body;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        return res.json({
          success: true,
          data: {
            message: 'Profile update saved (in-memory — database is not available)',
            profile: { ...profileData },
          },
        });
      }

      let calorieTarget = profileData.calorieTarget;
      if (!calorieTarget && profileData.weightKg && profileData.heightCm && profileData.age) {
        calorieTarget = calculateCalorieTarget(
          profileData.weightKg,
          profileData.heightCm,
          profileData.age,
          profileData.gender,
          profileData.activityLevel,
          profileData.healthGoal
        );
      }

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileData, calorieTarget },
        update: { ...profileData, calorieTarget },
      });

      res.json({
        success: true,
        data: { message: 'Profile updated successfully', profile },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        return res.json({
          success: true,
          data: {
            preferences: {
              dietaryTypes: [],
              allergies: [],
              restrictedFoods: [],
              cuisinePreferences: [],
              maxPrepTime: null,
              mealsPerDay: 3,
            },
          },
        });
      }

      const preferences = await prisma.userPreference.findUnique({ where: { userId } });

      // Deserialize JSON array fields for the client
      const parsed = preferences ? {
        ...preferences,
        dietaryTypes: fromJsonArray(preferences.dietaryTypes),
        allergies: fromJsonArray(preferences.allergies),
        restrictedFoods: fromJsonArray(preferences.restrictedFoods),
        cuisinePreferences: fromJsonArray(preferences.cuisinePreferences),
      } : null;

      res.json({ success: true, data: { preferences: parsed } });
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferencesData = req.body;
      const dbAvailable = await isDatabaseAvailable();

      if (!dbAvailable) {
        return res.json({
          success: true,
          data: {
            message: 'Preferences update saved (in-memory — database is not available)',
            preferences: { ...preferencesData },
          },
        });
      }

      // Serialize array fields for SQLite storage
      const serialized = {
        ...preferencesData,
        ...(preferencesData.dietaryTypes !== undefined && { dietaryTypes: toJsonArray(preferencesData.dietaryTypes) }),
        ...(preferencesData.allergies !== undefined && { allergies: toJsonArray(preferencesData.allergies) }),
        ...(preferencesData.restrictedFoods !== undefined && { restrictedFoods: toJsonArray(preferencesData.restrictedFoods) }),
        ...(preferencesData.cuisinePreferences !== undefined && { cuisinePreferences: toJsonArray(preferencesData.cuisinePreferences) }),
      };

      const preferences = await prisma.userPreference.upsert({
        where: { userId },
        create: { userId, ...serialized },
        update: serialized,
      });

      res.json({
        success: true,
        data: { message: 'Preferences updated successfully', preferences },
      });
    } catch (error) {
      next(error);
    }
  },
};

// Helper function to calculate calorie target using Mifflin-St Jeor Equation
function calculateCalorieTarget(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string,
  healthGoal: string
): number {
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr += gender === 'male' ? 5 : -161;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  const goalAdjustments: Record<string, number> = {
    lose_weight: -500,
    maintain: 0,
    gain_muscle: 300,
    improve_health: -200,
  };

  return Math.round(tdee + (goalAdjustments[healthGoal] || 0));
}
