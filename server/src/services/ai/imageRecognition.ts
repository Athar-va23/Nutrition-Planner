import vision from '@google-cloud/vision';

// Initialize Google Cloud Vision client
// Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
let client: vision.ImageAnnotatorClient | null = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    client = new vision.ImageAnnotatorClient();
  }
} catch (error) {
  console.warn('Google Vision client not initialized:', error);
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

// Common food-related keywords for filtering
const FOOD_KEYWORDS = [
  'food',
  'fruit',
  'vegetable',
  'meat',
  'dairy',
  'beverage',
  'ingredient',
  'produce',
  'grocery',
  'cuisine',
  'dish',
  'meal',
  'snack',
  'bread',
  'pasta',
  'rice',
  'salad',
  'soup',
  'dessert',
  'drink',
];

// Ingredient mapping for common detected labels
const INGREDIENT_MAPPING: Record<string, string> = {
  'bell pepper': 'bell pepper',
  'bell peppers': 'bell pepper',
  'sweet pepper': 'bell pepper',
  'capsicum': 'bell pepper',
  'chili pepper': 'chili',
  'jalapeno': 'jalapeno pepper',
  'tomato': 'tomato',
  'tomatoes': 'tomato',
  'cherry tomato': 'cherry tomato',
  'onion': 'onion',
  'onions': 'onion',
  'red onion': 'red onion',
  'garlic': 'garlic',
  'potato': 'potato',
  'potatoes': 'potato',
  'carrot': 'carrot',
  'carrots': 'carrot',
  'broccoli': 'broccoli',
  'cauliflower': 'cauliflower',
  'spinach': 'spinach',
  'lettuce': 'lettuce',
  'cabbage': 'cabbage',
  'cucumber': 'cucumber',
  'zucchini': 'zucchini',
  'eggplant': 'eggplant',
  'mushroom': 'mushroom',
  'mushrooms': 'mushroom',
  'avocado': 'avocado',
  'lemon': 'lemon',
  'lime': 'lime',
  'orange': 'orange',
  'apple': 'apple',
  'banana': 'banana',
  'strawberry': 'strawberry',
  'blueberry': 'blueberry',
  'grape': 'grape',
  'chicken': 'chicken',
  'chicken breast': 'chicken breast',
  'beef': 'beef',
  'steak': 'beef steak',
  'pork': 'pork',
  'fish': 'fish',
  'salmon': 'salmon',
  'shrimp': 'shrimp',
  'egg': 'egg',
  'eggs': 'eggs',
  'milk': 'milk',
  'cheese': 'cheese',
  'yogurt': 'yogurt',
  'butter': 'butter',
  'cream': 'cream',
  'bread': 'bread',
  'baguette': 'baguette',
  'pasta': 'pasta',
  'spaghetti': 'spaghetti',
  'rice': 'rice',
  'flour': 'flour',
  'sugar': 'sugar',
  'salt': 'salt',
  'pepper': 'pepper',
  'oil': 'cooking oil',
  'olive oil': 'olive oil',
  'vinegar': 'vinegar',
  'soy sauce': 'soy sauce',
  'ketchup': 'ketchup',
  'mustard': 'mustard',
  'mayonnaise': 'mayonnaise',
  'honey': 'honey',
  'jam': 'jam',
  'peanut butter': 'peanut butter',
  'cereal': 'cereal',
  'oats': 'oats',
  'yoghurt': 'yogurt',
  'juice': 'juice',
  'water': 'water',
  'soda': 'soda',
  'coffee': 'coffee',
  'tea': 'tea',
};

export class ImageRecognitionService {
  async detectIngredients(
    imageUrl: string,
    confidenceThreshold: number = 0.7
  ): Promise<{
    detections: DetectedIngredient[];
    detectedIngredients: string[];
  }> {
    if (!client) {
      throw new Error('Google Vision client not initialized');
    }

    try {
      // Use label detection for general food items
      const [labelResult] = await client.labelDetection(imageUrl);
      const labels = labelResult.labelAnnotations || [];

      // Use object localization for specific items
      const [objectResult] = await client.objectLocalization(imageUrl);
      const objects = objectResult.localizedObjectAnnotations || [];

      // Filter and process labels
      const detections: DetectedIngredient[] = [];
      const detectedIngredients: string[] = [];

      // Process labels
      for (const label of labels) {
        const confidence = label.score || 0;
        const description = (label.description || '').toLowerCase();

        if (confidence >= confidenceThreshold && this.isFoodRelated(description)) {
          const mappedIngredient = this.mapToIngredient(description);

          if (mappedIngredient && !detectedIngredients.includes(mappedIngredient)) {
            detections.push({
              ingredient: mappedIngredient,
              confidence: Math.round(confidence * 100) / 100,
            });
            detectedIngredients.push(mappedIngredient);
          }
        }
      }

      // Process objects for count information
      for (const obj of objects) {
        const confidence = obj.score || 0;
        const name = (obj.name || '').toLowerCase();

        if (confidence >= confidenceThreshold && this.isFoodRelated(name)) {
          const mappedIngredient = this.mapToIngredient(name);
          const existingDetection = detections.find(
            (d) => d.ingredient === mappedIngredient
          );

          if (existingDetection) {
            existingDetection.count = (existingDetection.count || 0) + 1;
            if (obj.boundingPoly?.normalizedVertices) {
              const vertices = obj.boundingPoly.normalizedVertices;
              existingDetection.boundingBox = this.calculateBoundingBox(vertices);
            }
          }
        }
      }

      return {
        detections,
        detectedIngredients,
      };
    } catch (error) {
      console.error('Image recognition error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private isFoodRelated(label: string): boolean {
    const lowerLabel = label.toLowerCase();

    // Check against food keywords
    if (FOOD_KEYWORDS.some((keyword) => lowerLabel.includes(keyword))) {
      return true;
    }

    // Check against ingredient mapping
    if (INGREDIENT_MAPPING[lowerLabel]) {
      return true;
    }

    return false;
  }

  private mapToIngredient(label: string): string | null {
    const lowerLabel = label.toLowerCase();

    // Direct mapping
    if (INGREDIENT_MAPPING[lowerLabel]) {
      return INGREDIENT_MAPPING[lowerLabel];
    }

    // Partial matching
    for (const [key, value] of Object.entries(INGREDIENT_MAPPING)) {
      if (lowerLabel.includes(key)) {
        return value;
      }
    }

    // Return original if no mapping found
    return lowerLabel;
  }

  private calculateBoundingBox(
    vertices: { x?: number; y?: number }[]
  ): { x: number; y: number; width: number; height: number } {
    const xs = vertices.map((v) => v.x || 0);
    const ys = vertices.map((v) => v.y || 0);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: Math.round(minX * 100) / 100,
      y: Math.round(minY * 100) / 100,
      width: Math.round((maxX - minX) * 100) / 100,
      height: Math.round((maxY - minY) * 100) / 100,
    };
  }
}

// Fallback service using simple keyword matching
export class FallbackImageRecognitionService {
  async detectIngredients(
    imageUrl: string,
    confidenceThreshold: number = 0.7
  ): Promise<{
    detections: DetectedIngredient[];
    detectedIngredients: string[];
  }> {
    // This is a placeholder for when Google Vision is not available
    // In production, you might use another service or return an error
    console.warn('Using fallback image recognition - limited functionality');

    return {
      detections: [],
      detectedIngredients: [],
    };
  }
}
