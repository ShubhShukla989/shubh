import Redis from 'ioredis';

// Check if Redis is configured
const isRedisConfigured = !!process.env.REDIS_URL;

// Create Redis client with short timeouts so fallback is fast
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,   // Only 1 retry (was 3)
  retryStrategy(times) {
    if (times > 1) return null; // Stop retrying after 1 attempt
    return 500;
  },
  connectTimeout: 1500,       // 1.5 seconds max (was 10 seconds)
  commandTimeout: 1000,       // 1 second per command
  enableOfflineQueue: false,  // Don't queue commands when offline (was true)
  lazyConnect: true,
});

// Log Redis status on startup
if (!isRedisConfigured && process.env.NODE_ENV === 'development') {
  console.log('ℹ️  Redis not configured - running without cache (set REDIS_URL to enable)');
}

// Handle connection events
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  // Silent fallback - only log in development if Redis is expected
  if (process.env.NODE_ENV === 'development' && isRedisConfigured) {
    console.warn('⚠️ Redis connection issue:', err.message);
  }
  // In production or when Redis is not configured, fail silently
});

redis.on('close', () => {
  isConnected = false; // Allow ensureConnection to attempt reconnect after cooldown
  if (process.env.NODE_ENV === 'development' && isRedisConfigured) {
    console.warn('⚠️ Redis connection closed');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});

// Connect on first use
let isConnecting = false;
let isConnected = false;
let connectionFailedAt: number | null = null; // Timestamp of last failure
const CONNECTION_RETRY_COOLDOWN = 30_000; // Retry Redis after 30 seconds, not never

async function ensureConnection() {
  if (isConnected) return true;

  // If we failed recently, don't hammer Redis — but do retry after cooldown
  if (connectionFailedAt !== null) {
    if (Date.now() - connectionFailedAt < CONNECTION_RETRY_COOLDOWN) {
      return false; // Still in cooldown
    }
    // Cooldown expired — reset and try again
    connectionFailedAt = null;
  }

  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return isConnected;
  }
  
  try {
    isConnecting = true;
    await redis.connect();
    isConnected = true;
    isConnecting = false;
    connectionFailedAt = null;
    return true;
  } catch (error) {
    isConnecting = false;
    isConnected = false;
    connectionFailedAt = Date.now(); // Record when it failed, not a permanent flag
    return false;
  }
}

export default redis;

// Helper function to add jitter to TTL
// Prevents cache stampede when many keys expire simultaneously
function addJitter(baseTTL: number, jitterPercent: number = 10): number {
  const jitterRange = Math.floor(baseTTL * (jitterPercent / 100));
  const jitter = Math.floor(Math.random() * jitterRange);
  return baseTTL + jitter;
}

// Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const connected = await ensureConnection();
    if (!connected) return null;
    
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('[redis] getCached failed:', error);
    return null;
  }
}

// Cache stampede prevention with lock
export async function getCachedWithLock<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T | null> {
  try {
    const connected = await ensureConnection();
    if (!connected) {
      // No Redis, fetch directly
      return await fetchFn();
    }
    
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    
    // Cache miss - check if someone else is fetching
    const lockKey = `${key}:lock`;
    const lockAcquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');
    
    if (lockAcquired) {
      // We got the lock - fetch data
      try {
        const data = await fetchFn();
        
        // Cache the result with jitter to prevent simultaneous expiration
        const ttlWithJitter = addJitter(ttl);
        await redis.setex(key, ttlWithJitter, JSON.stringify(data));
        
        // Release lock
        await redis.del(lockKey);
        
        return data;
      } catch (error) {
        // Release lock on error
        await redis.del(lockKey);
        throw error;
      }
    } else {
      // Lock not acquired — fetch directly to avoid waiting on a potentially failed lock holder
      return await fetchFn();
    }
  } catch (error) {
    // Silent fallback - fetch directly
    return await fetchFn();
  }
}

export async function setCache(
  key: string, 
  value: any, 
  ttl: number = 3600
): Promise<void> {
  try {
    const connected = await ensureConnection();
    if (!connected) return;
    
    // Add jitter to prevent simultaneous expiration
    const ttlWithJitter = addJitter(ttl);
    await redis.setex(key, ttlWithJitter, JSON.stringify(value));
  } catch (error) {
    console.error('[redis] setCache failed:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const connected = await ensureConnection();
    if (!connected) return;
    
    await redis.del(key);
  } catch (error) {
    console.error('[redis] deleteCache failed:', error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const connected = await ensureConnection();
    if (!connected) return;
    
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[redis] deleteCachePattern failed:', error);
  }
}

export async function getCacheStats() {
  try {
    const connected = await ensureConnection();
    if (!connected) {
      return {
        connected: false,
        totalKeys: 0,
        hits: '0',
        misses: '0',
        hitRate: '0%',
        memoryUsed: '0B'
      };
    }
    
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();
    const memory = await redis.info('memory');
    
    const hits = extractStat(info, 'keyspace_hits');
    const misses = extractStat(info, 'keyspace_misses');
    
    return {
      connected: true,
      totalKeys: dbSize,
      hits,
      misses,
      hitRate: calculateHitRate(hits, misses),
      memoryUsed: extractStat(memory, 'used_memory_human')
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      connected: false,
      totalKeys: 0,
      hits: '0',
      misses: '0',
      hitRate: '0%',
      memoryUsed: '0B'
    };
  }
}

function extractStat(info: string, key: string): string {
  const match = info.match(new RegExp(`${key}:(.+)`));
  return match ? match[1].trim() : '0';
}

function calculateHitRate(hits: string, misses: string): string {
  const hitsNum = parseInt(hits);
  const missesNum = parseInt(misses);
  const total = hitsNum + missesNum;
  
  if (total === 0) return '0%';
  
  const rate = (hitsNum / total) * 100;
  return `${rate.toFixed(2)}%`;
}
