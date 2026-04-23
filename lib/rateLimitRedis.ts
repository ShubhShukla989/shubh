/**
 * Redis-based Rate Limiting for Production
 * 
 * Use this for multi-server deployments:
 * - Vercel
 * - AWS with multiple instances
 * - Docker clusters
 * - Serverless functions
 * 
 * Setup:
 * 1. Install: npm install ioredis
 * 2. Set REDIS_URL in .env
 * 3. Replace in-memory rate limiter with this
 */

import { logger } from "./logger";

// Lazy load Redis to avoid errors if not configured
let Redis: any;
let redis: any;

/**
 * Initialize Redis connection
 */
function getRedisClient() {
  if (redis) return redis;
  
  try {
    // Lazy load Redis
    Redis = require("ioredis");
    
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    
    if (!redisUrl) {
      logger.warn("Redis URL not configured, falling back to in-memory rate limiting");
      return null;
    }
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    
    redis.on("error", (error: Error) => {
      logger.error("Redis connection error", error);
    });
    
    redis.on("connect", () => {
      logger.info("Redis connected for rate limiting");
    });
    
    return redis;
  } catch (error) {
    logger.error("Failed to initialize Redis", error as Error);
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

/**
 * Check rate limit using Redis
 * Uses sliding window algorithm for accuracy
 */
export async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedisClient();
  
  // Fallback to in-memory if Redis not available
  if (!client) {
    return checkRateLimitMemory(key, maxRequests, windowMs);
  }
  
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    
    // Use Redis pipeline for atomic operations
    const pipeline = client.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in current window
    pipeline.zcard(redisKey);
    
    // Add current request
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    
    // Set expiry on the key
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error("Redis pipeline failed");
    }
    
    // Get count before adding current request
    const count = (results[1][1] as number) || 0;
    const allowed = count < maxRequests;
    const remaining = Math.max(0, maxRequests - count - 1);
    
    return {
      allowed,
      remaining,
      resetTime: now + windowMs,
      total: count + 1,
    };
  } catch (error) {
    logger.error("Redis rate limit check failed", error as Error, { key });
    console.error('[rateLimitRedis] Redis rate limit check failed, failing open:', error);
    // Fallback to allowing request on error (fail open)
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
      total: 0,
    };
  }
}

/**
 * Fallback in-memory rate limiting
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      total: 1,
    };
  }
  
  entry.count++;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    total: entry.count,
  };
}

/**
 * Clear rate limit for a key (useful for testing)
 */
export async function clearRateLimitRedis(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  
  try {
    await client.del(`ratelimit:${key}`);
  } catch (error) {
    logger.error("Failed to clear rate limit", error as Error, { key });
  }
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ count: number; remaining: number; resetTime: number }> {
  const client = getRedisClient();
  
  if (!client) {
    const entry = memoryStore.get(key);
    if (!entry) {
      return { count: 0, remaining: maxRequests, resetTime: Date.now() + windowMs };
    }
    return {
      count: entry.count,
      remaining: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
  
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    
    const count = await client.zcount(redisKey, windowStart, now);
    const remaining = Math.max(0, maxRequests - count);
    
    return {
      count,
      remaining,
      resetTime: now + windowMs,
    };
  } catch (error) {
    logger.error("Failed to get rate limit status", error as Error, { key });
    return { count: 0, remaining: maxRequests, resetTime: Date.now() + windowMs };
  }
}

/**
 * Close Redis connection (call on app shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    logger.info("Redis connection closed");
  }
}
