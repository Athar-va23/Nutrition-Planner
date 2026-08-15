import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { corsOptions } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import mealPlanRoutes from './routes/meal-plan.routes';
import recipeRoutes from './routes/recipe.routes';
import groceryRoutes from './routes/grocery.routes';
import imageRoutes from './routes/image.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

// Express Application instance
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(cors(corsOptions));
app.use(securityMiddleware);

// Health check (placed before rate limiter for uptime monitors)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/meal-plans', mealPlanRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/grocery-lists', groceryRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
