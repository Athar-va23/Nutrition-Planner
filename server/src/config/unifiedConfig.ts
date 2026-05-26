import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ── Startup validation ──
// Fail fast if critical environment variables are missing
const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'] as const;
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Required environment variable ${varName} is not set.`);
    process.exit(1);
  }
}

// Warn if JWT secrets are weak defaults (only block in production)
const WEAK_SECRETS = [
  'itsjwtsecret-randomwordsbecauseidontknowwhattotype',
  'itsjwtrefreshsecret-anditsthemaeasaboveidontknow',
  'secret', 'jwt_secret', 'changeme',
];
if (process.env.NODE_ENV === 'production') {
  if (WEAK_SECRETS.includes(process.env.JWT_SECRET!.toLowerCase())) {
    console.error('FATAL: JWT_SECRET is using a weak default value. Set a strong secret (min 64 random characters) for production.');
    process.exit(1);
  }
  if (WEAK_SECRETS.includes(process.env.JWT_REFRESH_SECRET!.toLowerCase())) {
    console.error('FATAL: JWT_REFRESH_SECRET is using a weak default value. Set a strong secret for production.');
    process.exit(1);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    url: process.env.DATABASE_URL!,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
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
