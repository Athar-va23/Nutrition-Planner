import { PrismaClient } from '@prisma/client';

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const prisma = new PrismaClient();

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface NutritionInfo {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  cholesterolMg?: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
  servingSize?: number;
  servingSizeUnit?: string;
}

// Nutrient ID mappings for USDA API
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003, // Protein
  carbs: 1005, // Carbohydrate
  fat: 1004, // Total lipid (fat)
  fiber: 1079, // Fiber, total dietary
  sugar: 2000, // Sugars, total including NLEA
  sodium: 1093, // Sodium, Na
  cholesterol: 1253, // Cholesterol
};

export class NutritionService {
  async searchFood(query: string): Promise<USDAFood[]> {
    if (!USDA_API_KEY) {
      throw new Error('USDA API key not configured');
    }

    try {
      const response = await fetch(
        `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
          query
        )}&pageSize=5&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`
      );

      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      return data.foods || [];
    } catch (error) {
      console.error('USDA search error:', error);
      return [];
    }
  }

  async getNutritionForIngredient(ingredient: Ingredient): Promise<NutritionInfo | null> {
    const foods = await this.searchFood(ingredient.name);

    if (foods.length === 0) {
      return null;
    }

    // Use the first match (most relevant)
    const food = foods[0];
    return this.calculateNutrition(food, ingredient.amount, ingredient.unit);
  }

  async analyzeMealNutrition(ingredients: Ingredient[]): Promise<{
    nutrition: NutritionInfo;
    breakdown: { ingredient: string; nutrition: NutritionInfo | null }[];
  }> {
    const results = await Promise.all(
      ingredients.map(async (ing) => {
        const nutrition = await this.getNutritionForIngredient(ing);
        return { ingredient: ing.name, nutrition };
      })
    );

    const totalNutrition = this.aggregateNutrition(
      results.map((r) => r.nutrition).filter((n): n is NutritionInfo => n !== null)
    );

    return {
      nutrition: totalNutrition,
      breakdown: results,
    };
  }

  private calculateNutrition(
    food: USDAFood,
    amount: number,
    unit: string
  ): NutritionInfo {
    // Get serving size (default to 100g if not specified)
    const servingSize = food.servingSize || 100;
    const servingUnit = food.servingSizeUnit || 'g';

    // Calculate multiplier based on requested amount
    let multiplier = 1;

    // Convert common units to grams/ml
    const unitConversions: Record<string, number> = {
      g: 1,
      gram: 1,
      grams: 1,
      ml: 1,
      'ml': 1,
      l: 1000,
      liter: 1000,
      kg: 1000,
      cup: 240,
      cups: 240,
      tbsp: 15,
      tablespoon: 15,
      tsp: 5,
      teaspoon: 5,
      oz: 28.35,
      ounce: 28.35,
      lb: 453.59,
      pound: 453.59,
      piece: 100, // Approximate
      pieces: 100,
    };

    const amountInGrams = amount * (unitConversions[unit.toLowerCase()] || 1);
    multiplier = amountInGrams / servingSize;

    // Extract nutrient values
    const getNutrientValue = (nutrientId: number): number => {
      const nutrient = food.foodNutrients.find((n) => n.nutrientId === nutrientId);
      return nutrient ? nutrient.value * multiplier : 0;
    };

    return {
      calories: Math.round(getNutrientValue(NUTRIENT_IDS.calories)),
      proteinG: Math.round(getNutrientValue(NUTRIENT_IDS.protein) * 10) / 10,
      carbsG: Math.round(getNutrientValue(NUTRIENT_IDS.carbs) * 10) / 10,
      fatG: Math.round(getNutrientValue(NUTRIENT_IDS.fat) * 10) / 10,
      fiberG: Math.round(getNutrientValue(NUTRIENT_IDS.fiber) * 10) / 10 || undefined,
      sugarG: Math.round(getNutrientValue(NUTRIENT_IDS.sugar) * 10) / 10 || undefined,
      sodiumMg: Math.round(getNutrientValue(NUTRIENT_IDS.sodium)) || undefined,
      cholesterolMg: Math.round(getNutrientValue(NUTRIENT_IDS.cholesterol)) || undefined,
    };
  }

  private aggregateNutrition(nutritionList: NutritionInfo[]): NutritionInfo {
    return nutritionList.reduce(
      (total, current) => ({
        calories: total.calories + current.calories,
        proteinG: Math.round((total.proteinG + current.proteinG) * 10) / 10,
        carbsG: Math.round((total.carbsG + current.carbsG) * 10) / 10,
        fatG: Math.round((total.fatG + current.fatG) * 10) / 10,
        fiberG: (total.fiberG || 0) + (current.fiberG || 0) || undefined,
        sugarG: (total.sugarG || 0) + (current.sugarG || 0) || undefined,
        sodiumMg: (total.sodiumMg || 0) + (current.sodiumMg || 0) || undefined,
        cholesterolMg:
          (total.cholesterolMg || 0) + (current.cholesterolMg || 0) || undefined,
      }),
      {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      }
    );
  }

  // Calculate health score (0-10) based on nutrition
  calculateHealthScore(nutrition: NutritionInfo): number {
    let score = 5; // Start at middle

    // Protein content (good)
    if (nutrition.proteinG > 20) score += 1;
    if (nutrition.proteinG > 30) score += 0.5;

    // Fiber content (good)
    if (nutrition.fiberG && nutrition.fiberG > 5) score += 1;

    // Low sugar (good)
    if (!nutrition.sugarG || nutrition.sugarG < 10) score += 0.5;

    // Low sodium (good)
    if (!nutrition.sodiumMg || nutrition.sodiumMg < 400) score += 0.5;

    // Balanced macros
    const totalMacros = nutrition.proteinG + nutrition.carbsG + nutrition.fatG;
    if (totalMacros > 0) {
      const proteinRatio = nutrition.proteinG / totalMacros;
      if (proteinRatio > 0.2 && proteinRatio < 0.4) score += 0.5;
    }

    // Penalize high calories (relative)
    if (nutrition.calories > 800) score -= 0.5;

    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }
}
