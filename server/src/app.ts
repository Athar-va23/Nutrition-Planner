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

// API Routes (mounted under /api/v1 and aliases for resilience)
const routeModules = [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/meal-plans', router: mealPlanRoutes },
  { path: '/recipes', router: recipeRoutes },
  { path: '/grocery-lists', router: groceryRoutes },
  { path: '/images', router: imageRoutes },
  { path: '/ai', router: aiRoutes },
];

for (const { path: routePath, router } of routeModules) {
  app.use(`/api/v1${routePath}`, router);
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
}

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
