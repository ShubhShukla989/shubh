import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for development (use Redis in production)
const cache = new Map<string, { data: any; expires: number; etag: string }>();

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: number; // ISR revalidation time
  staleWhileRevalidate?: number; // Serve stale while revalidating
}

/**
 * Generate cache key from request
 */
export function generateCacheKey(
  path: string, 
  params?: Record<string, any>
): string {
  const sortedParams = params ? 
    Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&') : '';
  
  return `${path}${sortedParams ? `?${sortedParams}` : ''}`;
}

/**
 * Generate ETag for response data
 */
export function generateETag(data: any): string {
  const content = JSON.stringify(data);
  const hash = require('crypto')
    .createHash('md5')
    .update(content)
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(cacheEntry: any): boolean {
  return cacheEntry && Date.now() < cacheEntry.expires;
}

/**
 * Set cache entry
 */
export function setCache(
  key: string, 
  data: any, 
  options: CacheOptions = {}
): void {
  const { ttl = 1800 } = options; // Default 30 minutes for extreme performance
  const expires = Date.now() + (ttl * 1000);
  const etag = generateETag(data);
  
  cache.set(key, { data, expires, etag });
  
  // Log cache set in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Cache SET: ${key} (TTL: ${ttl}s)`);
  }
}

/**
 * Get cache entry
 */
export function getCache(key: string): any | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (!isCacheValid(entry)) {
    cache.delete(key);
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️  Cache EXPIRED: ${key}`);
    }
    return null;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Cache HIT: ${key}`);
  }
  
  return entry;
}

/**
 * Delete cache entry
 */
export function deleteCache(key: string): void {
  cache.delete(key);
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗑️  Cache DELETE: ${key}`);
  }
}

/**
 * Clear cache by tags
 */
export function invalidateCacheByTags(tags: string[]): void {
  // In production, implement with Redis tags
  // For now, clear all cache (simple implementation)
  cache.clear();
  console.log(`🔄 Cache invalidated for tags: ${tags.join(', ')}`);
}

/**
 * Cache middleware for API routes
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { ttl = 1800, tags = [] } = options;
    
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req);
    }
    
    // Generate cache key
    const url = new URL(req.url);
    const cacheKey = generateCacheKey(url.pathname, Object.fromEntries(url.searchParams));
    
    // Check for cached response
    const cached = getCache(cacheKey);
    if (cached) {
      // Check ETag for conditional requests
      const ifNoneMatch = req.headers.get('if-none-match');
      if (ifNoneMatch === cached.etag) {
        return new NextResponse(null, { status: 304 });
      }
      
      // Return cached response
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
          'ETag': cached.etag,
          'X-Cache': 'HIT',
        },
      });
    }
    
    // Execute handler and cache response
    try {
      const response = await handler(req);
      
      if (response.ok) {
        const data = await response.json();
        setCache(cacheKey, data, { ttl, tags });
        
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
            'ETag': generateETag(data),
            'X-Cache': 'MISS',
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Cache middleware error:', error);
      return handler(req);
    }
  };
}

/**
 * Cache statistics
 */
export function getCacheStats(): {
  size: number;
  hitRate: number;
  entries: Array<{ key: string; expires: number; size: number }>;
} {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    expires: value.expires,
    size: JSON.stringify(value.data).length,
  }));
  
  return {
    size: cache.size,
    hitRate: 0, // Implement hit rate tracking
    entries,
  };
}