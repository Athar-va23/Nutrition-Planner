/**
 * Groq AI Client — Direct browser-to-Groq communication.
 * 
 * API Pattern Strategy (api-patterns skill):
 * - Uses Groq free tier (1M tokens/day) for ALL AI features
 * - No OpenRouter needed — eliminates one API key entirely
 * - Client-side calls reduce server load to zero for AI
 * - Aggressive response caching in localStorage (24h TTL)
 * - Small, fast models (llama-3.1-8b-instant) for insights/chat
 * - Larger model (meta-llama/llama-4-scout-17b-16e-instruct) for meal plan & recipe generation
 * - Vision model (llama-3.2-11b-vision-preview) for fridge scanning
 * 
 * Cost: $0/month on free tier for typical usage.
 */

import { localStore, type MealPlanLocal, type RecipeLocal } from './localStore';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq API key — user-provided via Settings page, stored in localStorage.
// NEVER bundle API keys via VITE_ env vars — they're visible in the client bundle.
function getGroqKey(): string {
  return localStorage.getItem('nutripro_groq_key') || '';
}

export function setGroqKey(key: string): void {
  localStorage.setItem('nutripro_groq_key', key);
}

export function hasGroqKey(): boolean {
  return !!getGroqKey();
}

// ── Cache Layer ──
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`groq_cache_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`groq_cache_${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`groq_cache_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Quota exceeded — clear old caches
    Object.keys(localStorage)
      .filter(k => k.startsWith('groq_cache_'))
      .forEach(k => localStorage.removeItem(k));
  }
}

function hashObj(obj: unknown): string {
  return btoa(JSON.stringify(obj)).slice(0, 32);
}

// ── Robust JSON Parser ──
function safeParseJSON(raw: string): any {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Attempt to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      raw.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Last resort: try to fix common issues (trailing commas, etc.)
        const cleaned = jsonMatch[1]
          .trim()
          .replace(/,\s*([}\]])/g, '$1') // trailing commas
          .replace(/([\w"'])\s*\n\s*(["'{\[])/g, '$1,$2'); // missing commas
        try {
          return JSON.parse(cleaned);
        } catch {
          throw new Error('AI returned malformed data. Please try again.');
        }
      }
    }
    throw new Error('AI returned an unexpected response. Please try again.');
  }
}

// ── Core Request ──
async function groqRequest(
  messages: { role: string; content: string }[],
  model: string = 'llama-3.1-8b-instant',
  jsonMode: boolean = false,
  maxTokens: number = 1500,
): Promise<string> {
  const key = getGroqKey();
  if (!key) throw new Error('GROQ_KEY_MISSING');

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(err?.error?.message || `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Vision Request (multimodal) ──
async function groqVisionRequest(
  imageBase64: string,
  prompt: string,
  model: string = 'llama-3.2-11b-vision-preview',
  maxTokens: number = 2000,
): Promise<string> {
  const key = getGroqKey();
  if (!key) throw new Error('GROQ_KEY_MISSING');

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
  };

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(err?.error?.message || `Groq Vision error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Public API ──

export async function generateMealPlan(
  duration: 'daily' | 'weekly' = 'weekly',
): Promise<MealPlanLocal> {
  const profile = localStore.getUserProfile();
  const cacheKey = `plan_${hashObj({ profile, duration })}`;
  const cached = getCached<MealPlanLocal>(cacheKey);
  // Only use cache if the plan still exists in localStore (wasn't deleted)
  if (cached) {
    const exists = localStore.getMealPlans().some(p => p.id === cached.id);
    if (exists) return cached;
    // Plan was deleted — clear stale cache
    localStorage.removeItem(`groq_cache_${cacheKey}`);
  }

  const days = duration === 'daily' ? 1 : 7;

  const dietLabel = profile.dietaryTypes.length > 0 ? profile.dietaryTypes.join(', ') : 'No restrictions';
  const allergyLabel = profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None';
  const cuisineLabel = (profile.cuisinePreferences?.length || 0) > 0
    ? profile.cuisinePreferences.join(', ')
    : 'Any cuisine';

  const prompt = `Create a personalized ${duration} meal plan for this user:

USER PROFILE:
- Age: ${profile.age} years, Gender: ${profile.gender}
- Height: ${profile.heightCm}cm, Weight: ${profile.weightKg}kg
- Activity Level: ${profile.activityLevel}
- Health Goal: ${profile.healthGoal}
- Daily Calorie Target: ${profile.calorieTarget} kcal

DIETARY REQUIREMENTS:
- Diet Type: ${dietLabel}
- Food Allergies: ${allergyLabel}
- Preferred Cuisines: ${cuisineLabel}

IMPORTANT RULES:
1. STRICTLY exclude ALL allergens: ${allergyLabel}
2. STRICTLY follow diet type: ${dietLabel}
3. Prefer cuisine styles: ${cuisineLabel}
4. Each day must total approximately ${profile.calorieTarget} kcal
5. Balance macros based on goal: ${profile.healthGoal === 'gain_muscle' ? '35% protein, 40% carbs, 25% fat' : profile.healthGoal === 'lose_weight' ? '30% protein, 35% carbs, 35% fat' : '25% protein, 45% carbs, 30% fat'}

Return JSON:
{
  "name": "string",
  "days": [
    {
      "dayNumber": 1,
      "totalCalories": number,
      "meals": [
        {
          "type": "breakfast|lunch|dinner|snack",
          "name": "string",
          "description": "appetizing 1-2 sentence description",
          "calories": number,
          "prepTime": number,
          "cookTime": number,
          "servings": 2,
          "nutrition": { "protein": number, "carbs": number, "fat": number, "fiber": number },
          "ingredients": [{ "name": "string", "amount": number, "unit": "g|ml|cup|tbsp|tsp|piece" }],
          "instructions": ["Detailed step with temperature, timing, and visual cues"]
        }
      ]
    }
  ]
}

IMPORTANT FOR EACH MEAL:
- Include 4-8 ingredients with precise measurements
- Include 4-6 detailed cooking steps with specific temperatures (e.g., "350°F/175°C"), timing (e.g., "cook for 8-10 minutes"), and sensory cues (e.g., "until golden brown and fragrant")
- Make descriptions appetizing and specific

Include ${days} day(s). Each day: breakfast, lunch, dinner, 1 snack. Make meals varied, realistic, and appetizing.`;

  const raw = await groqRequest(
    [
      { role: 'system', content: 'You are an expert nutritionist specializing in personalized meal planning. Follow the user\'s dietary restrictions and allergies with ZERO exceptions. Return ONLY valid JSON. No markdown, no explanation.' },
      { role: 'user', content: prompt },
    ],
    'meta-llama/llama-4-scout-17b-16e-instruct',
    true,
    6000,
  );

  const parsed = safeParseJSON(raw);
  const plan: MealPlanLocal = {
    id: crypto.randomUUID(),
    name: parsed.name || `${duration.charAt(0).toUpperCase() + duration.slice(1)} Plan`,
    duration,
    createdAt: new Date().toISOString(),
    totalCalories: parsed.days?.reduce((s: number, d: any) => s + (d.totalCalories || 0), 0) || 0,
    days: parsed.days || [],
  };

  setCache(cacheKey, plan);
  localStore.saveMealPlan(plan);
  return plan;
}

export async function generateRecipes(
  ingredients: string[],
): Promise<RecipeLocal[]> {
  const cacheKey = `recipe_${hashObj(ingredients)}`;
  const cached = getCached<RecipeLocal[]>(cacheKey);
  if (cached) return cached;

  const prompt = `Create 3 detailed, restaurant-quality recipes using these ingredients: ${ingredients.join(', ')}

Return JSON:
{
  "recipes": [
    {
      "name": "string (creative, appetizing name)",
      "description": "2-3 sentence appetizing description of the dish, mentioning key flavors and textures",
      "calories": number,
      "prepTime": number,
      "cookTime": number,
      "servings": 2,
      "difficulty": "easy|medium|hard",
      "nutrition": { "protein": number, "carbs": number, "fat": number, "fiber": number },
      "ingredients": [{ "name": "string", "amount": number, "unit": "string", "original": true }],
      "instructions": ["Detailed step with specific temperatures, timing, and visual/sensory cues"],
      "tips": ["helpful cooking tip"]
    }
  ]
}

IMPORTANT REQUIREMENTS:
- Mark ingredients from the user's list with "original": true, extras with "original": false
- Add only essential extras (oil, salt, pepper, basic spices)
- Each recipe MUST have 5-8 detailed instruction steps
- Each step should include specific details like temperatures ("preheat oven to 375°F/190°C"), timing ("sauté for 3-4 minutes"), and sensory cues ("until onions are translucent and fragrant")
- Include 2-3 pro tips per recipe (substitutions, make-ahead advice, or flavor variations)
- Vary difficulty levels across the 3 recipes`;

  const raw = await groqRequest(
    [
      { role: 'system', content: 'You are an expert chef who writes detailed, foolproof recipes. Include precise temperatures, timing, and visual cues in every step. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ],
    'meta-llama/llama-4-scout-17b-16e-instruct',
    true,
    4500,
  );

  const parsed = safeParseJSON(raw);
  const recipes: RecipeLocal[] = (parsed.recipes || []).map((r: any) => ({
    ...r,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));

  setCache(cacheKey, recipes);
  localStore.saveRecipes(recipes);
  return recipes;
}

export async function chatWithAI(
  message: string,
  history: { role: string; content: string }[] = [],
): Promise<string> {
  const profile = localStore.getUserProfile();
  const todayLog = localStore.getTodayLog();

  const systemPrompt = `You are NutriAI, a concise, knowledgeable nutrition assistant.

User: ${profile.firstName}, ${profile.age}y, ${profile.heightCm}cm, ${profile.weightKg}kg
Goal: ${profile.healthGoal}, Target: ${profile.calorieTarget} kcal/day
Today's intake: ${todayLog ? `${todayLog.calories} kcal, ${todayLog.protein}g protein` : 'No data yet'}

Rules:
- Be brief (2-3 sentences max)
- Give actionable advice
- Use actual numbers when possible
- Don't repeat what the user said`;

  return groqRequest(
    [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4),
      { role: 'user', content: message },
    ],
    'llama-3.1-8b-instant',
    false,
    500,
  );
}

export async function generateInsights(): Promise<{
  insights: { title: string; description: string; type: 'info' | 'warning' | 'success' }[];
}> {
  const cacheKey = 'insights_' + new Date().toISOString().split('T')[0]; // 1 per day
  const cached = getCached<{ insights: any[] }>(cacheKey);
  if (cached) return cached;

  const profile = localStore.getUserProfile();
  const log = localStore.getNutritionLog().slice(0, 7);
  const plans = localStore.getMealPlans().slice(0, 1);

  const prompt = `Analyze this user and give 3 short nutrition insights.

Profile: ${profile.age}y, ${profile.heightCm}cm, ${profile.weightKg}kg, goal=${profile.healthGoal}, target=${profile.calorieTarget}kcal
Recent log: ${JSON.stringify(log.map(l => ({ date: l.date, cal: l.calories, protein: l.protein })))}
Has meal plan: ${plans.length > 0 ? 'yes' : 'no'}

Return JSON: { "insights": [{ "title": "string (5 words max)", "description": "string (1-2 sentences)", "type": "info|warning|success" }] }`;

  const raw = await groqRequest(
    [
      { role: 'system', content: 'Return ONLY valid JSON. Be practical and specific.' },
      { role: 'user', content: prompt },
    ],
    'llama-3.1-8b-instant',
    true,
    600,
  );

  const result = safeParseJSON(raw);
  setCache(cacheKey, result);
  return result;
}

// ── Meal Photo Analysis (for logging macros) ──

export interface MealPhotoAnalysis {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionSize: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeMealPhoto(imageBase64: string): Promise<MealPhotoAnalysis> {
  const prompt = `You are a sports nutritionist. Analyze this photo of a meal/food and estimate its nutritional content.

IMPORTANT: You do NOT need to be exact. Provide your best approximate estimate based on what you see — portion size, ingredients visible, typical preparation method.

Return ONLY valid JSON:
{
  "name": "Name of the dish (e.g., Chicken Biryani, Caesar Salad, Margherita Pizza)",
  "description": "Brief 1-sentence description of what you see",
  "calories": estimated_total_calories_as_number,
  "protein": estimated_protein_in_grams,
  "carbs": estimated_carbs_in_grams,
  "fat": estimated_fat_in_grams,
  "portionSize": "estimated portion (e.g., 1 plate ~350g, 1 bowl ~250ml, 2 slices)",
  "confidence": "high|medium|low"
}

Guidelines for estimation:
- A typical restaurant plate of rice + curry = 500-700 kcal
- A sandwich = 300-500 kcal
- A salad bowl = 200-400 kcal
- A slice of pizza = 250-350 kcal
- Round to nearest 10 for calories, nearest 5 for macros
- If unsure, lean toward medium estimates
- If the image is not food, return: {"name": "Unknown", "description": "Could not identify food", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "portionSize": "unknown", "confidence": "low"}`;

  const raw = await groqVisionRequest(imageBase64, prompt, 'llama-3.2-11b-vision-preview', 1000);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      name: parsed.name || 'Meal',
      description: parsed.description || '',
      calories: Math.round(parsed.calories || 0),
      protein: Math.round(parsed.protein || 0),
      carbs: Math.round(parsed.carbs || 0),
      fat: Math.round(parsed.fat || 0),
      portionSize: parsed.portionSize || '',
      confidence: parsed.confidence || 'medium',
    };
  } catch {
    throw new Error('Could not analyze the meal photo. Please try again with a clearer image.');
  }
}

