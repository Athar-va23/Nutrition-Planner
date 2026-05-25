export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthGoal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';
  calorieTarget?: number;
}

export interface UserPreferences {
  dietaryTypes: string[];
  allergies: string[];
  restrictedFoods: string[];
  cuisinePreferences: string[];
  maxPrepTime?: number;
  mealsPerDay: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  isOptional?: boolean;
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

export interface Meal {
  id: string;
  name: string;
  description?: string;
  instructions: string[];
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  cuisineType?: string;
  aiGenerated: boolean;
  ingredients: Ingredient[];
  nutritionInfo?: NutritionInfo;
}

export interface PlanMeal {
  id: string;
  dayNumber: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal: Meal;
}

export interface MealPlan {
  id: string;
  name: string;
  duration: 'daily' | 'weekly' | 'biweekly';
  startDate: string;
  endDate: string;
  totalCalories: number;
  aiGenerated: boolean;
  createdAt: string;
  days?: {
    dayNumber: number;
    meals: (Meal & { type: string })[];
  }[];
  planMeals?: PlanMeal[];
}

export interface GroceryItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  checked: boolean;
  recipes: string[];
}

export interface GroceryCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: GroceryItem[];
}

export interface GroceryList {
  id: string;
  name: string;
  mealPlanId?: string;
  generatedAt: string;
  categories: GroceryCategory[];
}

export interface DetectedIngredient {
  ingredient: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  count?: number;
}

export interface RecipeSuggestion {
  name: string;
  usesIngredients: string[];
  missingIngredients: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
