/**
 * Rate Limiting
 * 
 * Provides rate limiting for API routes to prevent abuse.
 * Tracks requests per IP address with configurable limits.
 * 
 * Fix for Assumption: 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Default rate limit configuration
 * 100 requests per 15 minutes
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests, please try again later',
};

/**
 * Strict rate limit for sensitive operations
 * 10 requests per 15 minutes
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests, please try again later',
};

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  return request.ip || 'unknown';
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = clientId;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  // Cleanup old entries periodically (every 100 requests)
  if (entry.count % 100 === 0) {
    cleanupExpiredEntries();
  }

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const clientId = getClientId(request);
    const result = checkRateLimit(clientId, config);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        clientId,
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Too many requests',
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Request allowed, return null to continue
    return null;
  };
}

/**
 * Apply rate limiting to API route handler
 */
export function withRateLimit<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await rateLimit(config)(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Rate limit passed, call handler
    return handler(request, ...args);
  };
}

/**
 * Clear rate limit for a client (useful for testing)
 */
export function clearRateLimit(clientId: string): void {
  rateLimitStore.delete(clientId);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(clientId: string): RateLimitEntry | null {
  return rateLimitStore.get(clientId) || null;
}
