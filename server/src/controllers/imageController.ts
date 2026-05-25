import { Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ImageRecognitionService } from '../services/ai/imageRecognition';
import { LLMService } from '../services/ai/llmService';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageRecognition = new ImageRecognitionService();
const llmService = new LLMService();

export const imageController = {
  async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('BAD_REQUEST', 400, 'No image file provided');
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'Invalid file type. Only JPEG, PNG, and WebP allowed.'
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new AppError('VALIDATION_ERROR', 400, 'File size exceeds 5MB limit');
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'nutrition-planner/fridge-images',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Resize large images
              { quality: 'auto:good' }, // Optimize quality
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file!.buffer);
      });

      const uploadResult = result as any;

      logger.info(`Image uploaded: ${uploadResult.secure_url}`);

      res.json({
        success: true,
        data: {
          image: {
            id: uploadResult.public_id,
            url: uploadResult.secure_url,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async detectIngredients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { imageUrl, confidenceThreshold = 0.7 } = req.body;

      // Detect ingredients using image recognition
      const detectionResult = await imageRecognition.detectIngredients(
        imageUrl,
        confidenceThreshold
      );

      // Generate recipe suggestions based on detected ingredients
      let recipeSuggestions = [];
      if (detectionResult.detectedIngredients.length > 0) {
        try {
          const aiResult = await llmService.generateRecipe(
            detectionResult.detectedIngredients,
            {
              maxPrepTime: 30,
              servings: 2,
            }
          );

          if (aiResult.recipes) {
            recipeSuggestions = aiResult.recipes.slice(0, 3).map((recipe: any) => ({
              name: recipe.name,
              usesIngredients: recipe.ingredients
                .filter((ing: any) => ing.original)
                .map((ing: any) => ing.name),
              missingIngredients: recipe.ingredients
                .filter((ing: any) => !ing.original)
                .map((ing: any) => ing.name),
            }));
          }
        } catch (aiError) {
          logger.warn('Failed to generate recipe suggestions:', aiError);
          // Continue without recipe suggestions
        }
      }

      logger.info(
        `Ingredients detected: ${detectionResult.detectedIngredients.length} items`
      );

      res.json({
        success: true,
        data: {
          detections: detectionResult.detections,
          detectedIngredients: detectionResult.detectedIngredients,
          recipeSuggestions,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
