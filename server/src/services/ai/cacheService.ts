import crypto from 'crypto';

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

let redis: any = null;
let redisAvailable = false;

async function getRedis() {
  if (redis !== null) return redisAvailable ? redis : null;

  try {
    const Redis = (await import('ioredis')).default;
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 1000);
      },
    });
    await redis.connect();
    redisAvailable = true;
    console.log('Redis connected successfully');
  } catch (error) {
    console.warn('Redis not available, using in-memory cache fallback');
    redis = 'unavailable';
    redisAvailable = false;
  }

  return redisAvailable ? redis : null;
}

export class AICacheService {
  private getCacheKey(type: string, params: object): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    return `ai:${type}:${hash}`;
  }

  async getCachedResult<T>(type: string, params: object): Promise<T | null> {
    try {
      const key = this.getCacheKey(type, params);
      const client = await getRedis();

      if (client) {
        const cached = await client.get(key);
        return cached ? JSON.parse(cached) : null;
      }

      // Fallback to in-memory
      const entry = memoryCache.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        return JSON.parse(entry.value);
      }
      if (entry) memoryCache.delete(key);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async cacheResult<T>(
    type: string,
    params: object,
    result: T,
    ttlSeconds: number = 86400 // 24 hours
  ): Promise<void> {
    try {
      const key = this.getCacheKey(type, params);
      const value = JSON.stringify(result);
      const client = await getRedis();

      if (client) {
        await client.setex(key, ttlSeconds, value);
      } else {
        // Fallback to in-memory
        memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidateCache(type: string, params: object): Promise<void> {
    try {
      const key = this.getCacheKey(type, params);
      const client = await getRedis();

      if (client) {
        await client.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
