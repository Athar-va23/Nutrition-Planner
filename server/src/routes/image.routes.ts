import { Router } from 'express';
import multer from 'multer';
import { imageController } from '../controllers/imageController';
import { authenticate } from '../middleware/auth';
import { validate, detectIngredientsSchema } from '../middleware/validation';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
    }
  },
});

router.use(authenticate);

router.post('/upload', upload.single('file'), imageController.uploadImage);
router.post('/detect', aiLimiter, validate(detectIngredientsSchema), imageController.detectIngredients);

export default router;
