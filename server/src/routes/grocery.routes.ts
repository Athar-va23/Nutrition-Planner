import { Router } from 'express';
import { groceryController } from '../controllers/groceryController';
import { authenticate } from '../middleware/auth';
import { validate, generateGroceryListSchema } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', groceryController.getGroceryLists);
router.post('/generate', validate(generateGroceryListSchema), groceryController.generateGroceryList);
router.get('/:id', groceryController.getGroceryList);
router.patch('/:listId/items/:itemId', groceryController.updateItem);
router.delete('/:id', groceryController.deleteGroceryList);

export default router;
