import { Router } from 'express';
import { recipeController } from '../controllers/recipeController';
import { authenticate } from '../middleware/auth';
import { validate, generateRecipeSchema } from '../middleware/validation';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/generate', aiLimiter, validate(generateRecipeSchema), recipeController.generateRecipe);
router.get('/search', recipeController.searchRecipes);

export default router;
