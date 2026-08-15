/**
 * LocalStore — persistent client-side storage for NutriPro.
 *
 * ALL keys are scoped by user ID to prevent data leaks between accounts.
 * Pattern: nutripro_{userId}_{key}
 *
 * On login, call localStore.setCurrentUser(userId) to scope data.
 * On logout, call localStore.setCurrentUser('') to clear scope.
 */

const GLOBAL_PREFIX = 'nutripro_';
let _currentUserId = '';

function getKey(key: string): string {
  if (!_currentUserId) return `${GLOBAL_PREFIX}${key}`;
  return `${GLOBAL_PREFIX}${_currentUserId}_${key}`;
}

export const localStore = {
  // ── User Scoping ──
  setCurrentUser(userId: string): void {
    const previousUserId = _currentUserId;
    _currentUserId = userId;

    // One-time migration: if old unscoped data exists and new scoped data doesn't,
    // copy it over for this user
    if (userId && !previousUserId) {
      this._migrateUnscopedData(userId);
    }
  },

  getCurrentUser(): string {
    return _currentUserId;
  },

  /** Migrate old flat nutripro_ keys → scoped nutripro_{userId}_ keys */
  _migrateUnscopedData(userId: string): void {
    const keysToMigrate = ['profile', 'mealPlans', 'recipes', 'nutritionLog', 'onboardingComplete', 'shoppingCart'];
    let migrated = false;

    for (const key of keysToMigrate) {
      const oldKey = `${GLOBAL_PREFIX}${key}`;
      const newKey = `${GLOBAL_PREFIX}${userId}_${key}`;
      const oldData = localStorage.getItem(oldKey);

      // Only migrate if old data exists AND new scoped data doesn't
      if (oldData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
        migrated = true;
      }
    }

    // Clean up old unscoped keys after migration
    if (migrated) {
      for (const key of keysToMigrate) {
        localStorage.removeItem(`${GLOBAL_PREFIX}${key}`);
      }
    }
  },

  // ── Generic CRUD ──
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(getKey(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(getKey(key));
  },

  // ── User Profile ──
  getUserProfile(): UserProfileLocal {
    const saved = this.get<Partial<UserProfileLocal>>('profile', {});
    return {
      ...defaultProfile,
      ...saved,
      dietaryTypes: saved.dietaryTypes || defaultProfile.dietaryTypes,
      allergies: saved.allergies || defaultProfile.allergies,
      cuisinePreferences: saved.cuisinePreferences || defaultProfile.cuisinePreferences,
    };
  },

  setUserProfile(profile: Partial<UserProfileLocal>): void {
    const current = this.getUserProfile();
    this.set('profile', {
      ...current,
      ...profile,
    });
  },

  // ── Meal Plans ──
  getMealPlans(): MealPlanLocal[] {
    return this.get<MealPlanLocal[]>('mealPlans', []);
  },

  saveMealPlan(plan: MealPlanLocal): void {
    const plans = this.getMealPlans();
    plans.unshift(plan);
    this.set('mealPlans', plans.slice(0, 20)); // Keep latest 20
  },

  deleteMealPlan(id: string): void {
    const plans = this.getMealPlans().filter(p => p.id !== id);
    this.set('mealPlans', plans);
  },

  updateMealPlan(updated: MealPlanLocal): void {
    const plans = this.getMealPlans();
    const idx = plans.findIndex(p => p.id === updated.id);
    if (idx >= 0) {
      plans[idx] = updated;
      this.set('mealPlans', plans);
    }
  },

  addMealToPlan(planId: string, dayNumber: number, meal: MealLocal): void {
    const plans = this.getMealPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    let day = plan.days.find(d => d.dayNumber === dayNumber);
    if (!day) {
      day = { dayNumber, meals: [], totalCalories: 0 };
      plan.days.push(day);
      plan.days.sort((a, b) => a.dayNumber - b.dayNumber);
    }

    day.meals.push(meal);
    day.totalCalories = day.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    plan.totalCalories = plan.days.reduce((sum, d) => sum + (d.totalCalories || 0), 0);

    this.updateMealPlan(plan);
  },

  removeMealFromPlan(planId: string, dayNumber: number, mealIndex: number): void {
    const plans = this.getMealPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const day = plan.days.find(d => d.dayNumber === dayNumber);
    if (!day) return;

    day.meals.splice(mealIndex, 1);
    day.totalCalories = day.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    plan.totalCalories = plan.days.reduce((sum, d) => sum + (d.totalCalories || 0), 0);

    // Remove empty days
    if (day.meals.length === 0) {
      plan.days = plan.days.filter(d => d.dayNumber !== dayNumber);
    }

    this.updateMealPlan(plan);
  },

  addDayToPlan(planId: string): number {
    const plans = this.getMealPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return 1;

    const maxDay = plan.days.reduce((max, d) => Math.max(max, d.dayNumber), 0);
    const newDay: MealPlanDay = { dayNumber: maxDay + 1, meals: [], totalCalories: 0 };
    plan.days.push(newDay);
    this.updateMealPlan(plan);
    return newDay.dayNumber;
  },

  // ── Recipes ──
  getRecipes(): RecipeLocal[] {
    return this.get<RecipeLocal[]>('recipes', []);
  },

  saveRecipes(recipes: RecipeLocal[]): void {
    const existing = this.getRecipes();
    const combined = [...recipes, ...existing].slice(0, 50);
    this.set('recipes', combined);
  },

  // ── Nutrition Log ──
  getNutritionLog(): DailyLogEntry[] {
    return this.get<DailyLogEntry[]>('nutritionLog', []);
  },

  addNutritionLogEntry(entry: DailyLogEntry): void {
    const log = this.getNutritionLog();
    log.unshift(entry);
    this.set('nutritionLog', log.slice(0, 90)); // 90 days
  },

  getTodayLog(): DailyLogEntry | null {
    const today = new Date().toISOString().split('T')[0];
    return this.getNutritionLog().find(e => e.date === today) || null;
  },

  updateTodayLog(partial: Partial<DailyLogEntry>): void {
    const today = new Date().toISOString().split('T')[0];
    const log = this.getNutritionLog();
    const idx = log.findIndex(e => e.date === today);
    if (idx >= 0) {
      log[idx] = { ...log[idx], ...partial };
    } else {
      log.unshift({ date: today, calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, meals: [], ...partial });
    }
    this.set('nutritionLog', log.slice(0, 90));
  },

  // ── Shopping Cart ──
  getShoppingCart(): ShoppingCartItem[] {
    return this.get<ShoppingCartItem[]>('shoppingCart', []);
  },

  addToShoppingCart(items: ShoppingCartItem[]): void {
    const cart = this.getShoppingCart();
    for (const item of items) {
      const existing = cart.find(c => c.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        // Merge: add amounts if units match
        if (existing.unit === item.unit) {
          existing.amount += item.amount;
        }
        if (!existing.fromRecipes.includes(item.fromRecipes[0])) {
          existing.fromRecipes.push(...item.fromRecipes);
        }
      } else {
        cart.push(item);
      }
    }
    this.set('shoppingCart', cart);
  },

  removeFromShoppingCart(name: string): void {
    const cart = this.getShoppingCart().filter(c => c.name.toLowerCase() !== name.toLowerCase());
    this.set('shoppingCart', cart);
  },

  clearShoppingCart(): void {
    this.set('shoppingCart', []);
  },

  // ── Onboarding ──
  isOnboardingComplete(): boolean {
    return this.get<boolean>('onboardingComplete', false);
  },

  setOnboardingComplete(): void {
    this.set('onboardingComplete', true);
  },
};

// ── Types ──
export interface UserProfileLocal {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  healthGoal: string;
  calorieTarget: number;
  dietaryTypes: string[];
  allergies: string[];
  cuisinePreferences: string[];
}

export interface MealPlanLocal {
  id: string;
  name: string;
  duration: string;
  createdAt: string;
  totalCalories: number;
  days: MealPlanDay[];
}

export interface MealPlanDay {
  dayNumber: number;
  meals: MealLocal[];
  totalCalories: number;
}

export interface MealLocal {
  type: string;
  name: string;
  description: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: { protein: number; carbs: number; fat: number; fiber: number };
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: string[];
}

export interface RecipeLocal {
  id: string;
  name: string;
  description: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  nutrition: { protein: number; carbs: number; fat: number; fiber: number };
  ingredients: { name: string; amount: number; unit: string; original?: boolean }[];
  instructions: string[];
  tips: string[];
  createdAt: string;
}

export interface DailyLogEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: { name: string; calories: number; time: string; source?: 'photo' | 'preset' | 'manual' | 'plan' }[];
}

export interface ShoppingCartItem {
  name: string;
  amount: number;
  unit: string;
  fromRecipes: string[];
}

const defaultProfile: UserProfileLocal = {
  firstName: 'User',
  lastName: '',
  email: '',
  age: 25,
  gender: 'other',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  healthGoal: 'maintain',
  calorieTarget: 2200,
  dietaryTypes: [],
  allergies: [],
  cuisinePreferences: [],
};
