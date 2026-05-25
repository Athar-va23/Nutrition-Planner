import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123456', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nutritionplanner.com' },
    update: {},
    create: {
      email: 'demo@nutritionplanner.com',
      passwordHash: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      profile: {
        create: {
          age: 30,
          gender: 'female',
          heightCm: 165,
          weightKg: 65,
          activityLevel: 'moderate',
          healthGoal: 'maintain',
          calorieTarget: 2000,
        },
      },
      preferences: {
        create: {
          dietaryTypes: ['balanced'],
          allergies: [],
          restrictedFoods: [],
          cuisinePreferences: ['mediterranean', 'asian', 'american'],
          maxPrepTime: 45,
          mealsPerDay: 3,
        },
      },
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create sample meals
  const sampleMeals = [
    {
      name: 'Greek Yogurt Bowl with Berries',
      description: 'Creamy Greek yogurt topped with fresh mixed berries and a drizzle of honey',
      instructions: [
        'Add Greek yogurt to a bowl',
        'Wash and prepare mixed berries',
        'Top yogurt with berries',
        'Drizzle with honey',
        'Optional: sprinkle with granola',
      ],
      prepTimeMin: 5,
      cookTimeMin: 0,
      servings: 1,
      difficulty: 'easy' as const,
      cuisineType: 'mediterranean',
      aiGenerated: false,
      ingredients: [
        { name: 'Greek yogurt', amount: 200, unit: 'g' },
        { name: 'Mixed berries', amount: 100, unit: 'g' },
        { name: 'Honey', amount: 15, unit: 'ml' },
      ],
      nutritionInfo: {
        calories: 280,
        proteinG: 20,
        carbsG: 35,
        fatG: 6,
        fiberG: 4,
        sugarG: 28,
      },
    },
    {
      name: 'Grilled Chicken Salad',
      description: 'Fresh garden salad with grilled chicken breast and light vinaigrette',
      instructions: [
        'Season chicken breast with salt and pepper',
        'Grill chicken for 6-7 minutes per side until cooked through',
        'Let chicken rest for 5 minutes, then slice',
        'Wash and chop mixed greens and vegetables',
        'Combine greens, vegetables, and chicken in a bowl',
        'Drizzle with vinaigrette and toss to coat',
      ],
      prepTimeMin: 15,
      cookTimeMin: 15,
      servings: 1,
      difficulty: 'easy' as const,
      cuisineType: 'american',
      aiGenerated: false,
      ingredients: [
        { name: 'Chicken breast', amount: 150, unit: 'g' },
        { name: 'Mixed greens', amount: 100, unit: 'g' },
        { name: 'Cherry tomatoes', amount: 50, unit: 'g' },
        { name: 'Cucumber', amount: 50, unit: 'g' },
        { name: 'Olive oil', amount: 15, unit: 'ml' },
        { name: 'Balsamic vinegar', amount: 10, unit: 'ml' },
      ],
      nutritionInfo: {
        calories: 380,
        proteinG: 35,
        carbsG: 12,
        fatG: 22,
        fiberG: 4,
        sugarG: 6,
      },
    },
    {
      name: 'Vegetable Stir-Fry with Tofu',
      description: 'Colorful vegetable stir-fry with crispy tofu in a savory sauce',
      instructions: [
        'Press tofu to remove excess water, then cube',
        'Heat oil in a wok or large pan over high heat',
        'Fry tofu cubes until golden and crispy, remove and set aside',
        'Stir-fry vegetables for 3-4 minutes until crisp-tender',
        'Add garlic, ginger, and soy sauce',
        'Return tofu to pan and toss to combine',
        'Serve over rice',
      ],
      prepTimeMin: 15,
      cookTimeMin: 15,
      servings: 2,
      difficulty: 'medium' as const,
      cuisineType: 'asian',
      aiGenerated: false,
      ingredients: [
        { name: 'Firm tofu', amount: 300, unit: 'g' },
        { name: 'Broccoli', amount: 200, unit: 'g' },
        { name: 'Bell pepper', amount: 100, unit: 'g' },
        { name: 'Carrot', amount: 100, unit: 'g' },
        { name: 'Soy sauce', amount: 30, unit: 'ml' },
        { name: 'Garlic', amount: 3, unit: 'clove' },
        { name: 'Ginger', amount: 10, unit: 'g' },
        { name: 'Vegetable oil', amount: 15, unit: 'ml' },
        { name: 'Rice', amount: 200, unit: 'g' },
      ],
      nutritionInfo: {
        calories: 420,
        proteinG: 18,
        carbsG: 55,
        fatG: 14,
        fiberG: 8,
        sugarG: 8,
      },
    },
  ];

  for (const mealData of sampleMeals) {
    const { ingredients, nutritionInfo, ...mealInfo } = mealData;
    
    const meal = await prisma.meal.create({
      data: {
        ...mealInfo,
        ingredients: {
          create: ingredients,
        },
        nutritionInfo: {
          create: nutritionInfo,
        },
      },
    });
    
    console.log('Created sample meal:', meal.name);
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
