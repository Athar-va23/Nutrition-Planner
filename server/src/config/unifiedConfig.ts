import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or root directory
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Default DATABASE_URL for SQLite if not explicitly set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

// Ensure JWT secrets have fallbacks with warnings rather than crashing
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using a fallback secret for runtime.');
  process.env.JWT_SECRET = 'nutripro-production-jwt-access-secret-key-32chars-min';
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('WARNING: JWT_REFRESH_SECRET is not set. Using a fallback secret for runtime.');
  process.env.JWT_REFRESH_SECRET = 'nutripro-production-jwt-refresh-secret-key-32chars-min';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    jwtIssuer: 'nutripro-api',
    jwtAudience: 'nutripro-client',
  },
  ai: {
    groqKey: process.env.GROQ_API_KEY,
    openRouterKey: process.env.OPENROUTER_API_KEY,
  },
  external: {
    usdaKey: process.env.USDA_API_KEY,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },
};
