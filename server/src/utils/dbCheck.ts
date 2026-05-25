import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();
let dbDown = false;

/**
 * Returns true if PostgreSQL is reachable; false otherwise.
 * Caches the "down" state and only retries every 30 seconds to avoid
 * hammering a dead connection on every single API call.
 */
let lastCheck = 0;
const RETRY_INTERVAL_MS = 30_000;

export async function isDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (dbDown && now - lastCheck < RETRY_INTERVAL_MS) {
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    if (dbDown) {
      logger.info('PostgreSQL connection restored');
      dbDown = false;
    }
    lastCheck = now;
    return true;
  } catch {
    if (!dbDown) {
      logger.warn('PostgreSQL is unreachable – controllers will return fallback data');
      dbDown = true;
    }
    lastCheck = now;
    return false;
  }
}

export { prisma };
