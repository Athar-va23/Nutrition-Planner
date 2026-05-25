import { UserProfile, Preferences, RecipePreferences } from './llmService';

export function buildMealPlanPrompt(
  userProfile: UserProfile,
  preferences: Preferences,
  duration: 'daily' | 'weekly' | 'biweekly'
): string {
  const daysCount = duration === 'daily' ? 1 : duration === 'weekly' ? 7 : 14;

  return `
Create a ${duration} meal plan for a user with the following profile:

USER PROFILE:
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Height: ${userProfile.heightCm ? userProfile.heightCm + 'cm' : 'Not specified'}
- Weight: ${userProfile.weightKg ? userProfile.weightKg + 'kg' : 'Not specified'}
- Activity Level: ${userProfile.activityLevel}
- Health Goal: ${userProfile.healthGoal}
- Daily Calorie Target: ${userProfile.calorieTarget || 'Not specified'} calories

DIETARY PREFERENCES:
- Dietary Types: ${preferences.dietaryTypes.join(', ') || 'None specified'}
- Allergies: ${preferences.allergies.join(', ') || 'None'}
- Restricted Foods: ${preferences.restrictedFoods.join(', ') || 'None'}
- Preferred Cuisines: ${preferences.cuisinePreferences.join(', ') || 'Any'}
- Max Prep Time: ${preferences.maxPrepTime || 45} minutes per meal

REQUIREMENTS:
1. Create ${daysCount} day(s) of meals
2. Include breakfast, lunch, dinner, and 1-2 snacks per day
3. Each day should total approximately ${userProfile.calorieTarget || 2000} calories
4. Balance macronutrients: 30% protein, 40% carbs, 30% fat (adjust based on goals)
5. All recipes must strictly exclude allergens: ${preferences.allergies.join(', ') || 'none'}
6. Respect dietary preferences: ${preferences.dietaryTypes.join(', ') || 'none'}
7. Provide detailed ingredient lists with amounts in grams or milliliters
8. Include step-by-step cooking instructions
9. Estimate prep time and nutrition for each meal
10. Vary meals to prevent monotony

HEALTH GOAL ADJUSTMENTS:
- lose_weight: Lower calories, higher protein, lower carbs
- gain_muscle: Higher calories, higher protein
- maintain: Balanced macros at target calories
- improve_health: Nutrient-dense foods, variety of vegetables

RESPONSE FORMAT (JSON):
{
  "mealPlan": {
    "name": "string - descriptive name for the meal plan",
    "duration": "${duration}",
    "totalCalories": number - total calories for entire plan,
    "dailyAverage": number - average calories per day,
    "days": [
      {
        "dayNumber": number - 1 to ${daysCount},
        "date": "YYYY-MM-DD format",
        "totalCalories": number,
        "meals": [
          {
            "type": "breakfast|lunch|dinner|snack",
            "name": "string - appetizing meal name",
            "description": "string - brief description",
            "calories": number,
            "prepTime": number - minutes,
            "cookTime": number - minutes,
            "servings": number,
            "nutrition": {
              "protein": number - grams,
              "carbs": number - grams,
              "fat": number - grams,
              "fiber": number - grams
            },
            "ingredients": [
              {
                "name": "string - specific ingredient name",
                "amount": number,
                "unit": "g|ml|cup|tbsp|tsp|piece"
              }
            ],
            "instructions": ["string - step by step instructions"]
          }
        ]
      }
    ]
  }
}`;
}

export function buildRecipePrompt(
  ingredients: string[],
  preferences: RecipePreferences
): string {
  return `
Create 3 recipe suggestions using these ingredients: ${ingredients.join(', ')}

PREFERENCES:
- Cuisine Type: ${preferences.cuisineType || 'Any'}
- Max Prep Time: ${preferences.maxPrepTime || 30} minutes
- Servings: ${preferences.servings || 2}
- Meal Type: ${preferences.mealType || 'Any'}

REQUIREMENTS:
1. Prioritize using the provided ingredients
2. List any additional ingredients needed (keep to minimum, common pantry items)
3. Provide realistic cooking instructions with clear steps
4. Include accurate nutrition estimates per serving
5. Suggest 2-3 variations for each recipe
6. Make recipes flavorful and appetizing
7. Consider dietary restrictions if implied by ingredients

RESPONSE FORMAT (JSON):
{
  "recipes": [
    {
      "name": "string - appetizing recipe name",
      "description": "string - brief enticing description",
      "calories": number - per serving,
      "prepTime": number - minutes,
      "cookTime": number - minutes,
      "servings": number,
      "difficulty": "easy|medium|hard",
      "nutrition": {
        "protein": number - grams,
        "carbs": number - grams,
        "fat": number - grams,
        "fiber": number - grams
      },
      "ingredients": [
        {
          "name": "string - ingredient name",
          "amount": number,
          "unit": "string - g|ml|cup|tbsp|tsp|piece",
          "original": boolean - true if from user's ingredient list
        }
      ],
      "instructions": ["string - clear step-by-step instructions"],
      "tips": ["string - cooking tips and tricks"],
      "variations": ["string - suggested variations"]
    }
  ],
  "suggestions": ["string - additional suggestions for using ingredients"]
}`;
}
