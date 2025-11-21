/**
 * NAIOS Platform - Redis Cache Utilities
 *
 * Comprehensive caching utilities using Redis with support for:
 * - Key-value caching with TTL
 * - JSON object caching
 * - Cache invalidation patterns
 * - Distributed locking
 * - Rate limiting
 * - Session management
 *
 * @module shared/utils/cache
 * @version 1.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// ============================================================================
// REDIS CLIENT CONFIGURATION
// ============================================================================

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error', { error: err });
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting...');
  });

  await redisClient.connect();

  logger.info('Redis cache initialized', { url: redisUrl });

  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

// ============================================================================
// BASIC CACHE OPERATIONS
// ============================================================================

/**
 * Set a value in cache with optional TTL
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds (default: 3600)
 *
 * @example
 * await setCache('user:123', userData, 3600);
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient();

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds > 0) {
      await client.setEx(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }

    logger.debug('Cache set', { key, ttl: ttlSeconds });
  } catch (error) {
    logger.error('Failed to set cache', { key, error });
    throw error;
  }
}

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @param parseJson - Whether to parse value as JSON (default: true)
 * @returns Cached value or null
 *
 * @example
 * const user = await getCache('user:123');
 */
export async function getCache<T = any>(
  key: string,
  parseJson: boolean = true
): Promise<T | null> {
  const client = getRedisClient();

  try {
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    logger.debug('Cache hit', { key });

    if (parseJson) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    }

    return value as T;
  } catch (error) {
    logger.error('Failed to get cache', { key, error });
    return null;
  }
}

/**
 * Delete a key from cache
 *
 * @param key - Cache key
 *
 * @example
 * await deleteCache('user:123');
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();

  try {
    await client.del(key);
    logger.debug('Cache deleted', { key });
  } catch (error) {
    logger.error('Failed to delete cache', { key, error });
    throw error;
  }
}

/**
 * Delete multiple keys matching a pattern
 *
 * @param pattern - Key pattern (e.g., 'user:*')
 *
 * @example
 * await deleteByPattern('user:*');
 */
export async function deleteByPattern(pattern: string): Promise<number> {
  const client = getRedisClient();

  try {
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    logger.debug('Cache pattern deleted', { pattern, count: keys.length });

    return keys.length;
  } catch (error) {
    logger.error('Failed to delete cache pattern', { pattern, error });
    throw error;
  }
}

/**
 * Check if a key exists in cache
 *
 * @param key - Cache key
 * @returns True if key exists
 */
export async function existsCache(key: string): Promise<boolean> {
  const client = getRedisClient();

  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check cache existence', { key, error });
    return false;
  }
}

/**
 * Get remaining TTL for a key
 *
 * @param key - Cache key
 * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function getTTL(key: string): Promise<number> {
  const client = getRedisClient();

  try {
    return await client.ttl(key);
  } catch (error) {
    logger.error('Failed to get TTL', { key, error });
    return -2;
  }
}

// ============================================================================
// CACHE-ASIDE PATTERN
// ============================================================================

/**
 * Get value from cache or execute function and cache result
 *
 * @param key - Cache key
 * @param fetchFn - Function to execute if cache miss
 * @param ttlSeconds - Cache TTL in seconds
 * @returns Cached or fetched value
 *
 * @example
 * const user = await getOrSet('user:123', async () => {
 *   return await db.getUserById('123');
 * }, 3600);
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key);

  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  logger.debug('Cache miss, fetching data', { key });
  const data = await fetchFn();

  // Store in cache
  await setCache(key, data, ttlSeconds);

  return data;
}

// ============================================================================
// DISTRIBUTED LOCKING
// ============================================================================

/**
 * Acquire a distributed lock
 *
 * @param lockKey - Lock key
 * @param ttlSeconds - Lock TTL in seconds
 * @param retries - Number of retry attempts
 * @returns Lock token if acquired, null otherwise
 *
 * @example
 * const lock = await acquireLock('process:123', 30);
 * if (lock) {
 *   try {
 *     // Do work
 *   } finally {
 *     await releaseLock('process:123', lock);
 *   }
 * }
 */
export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 30,
  retries: number = 3
): Promise<string | null> {
  const client = getRedisClient();
  const lockToken = crypto.randomUUID();

  for (let i = 0; i < retries; i++) {
    try {
      const result = await client.set(lockKey, lockToken, {
        NX: true,
        EX: ttlSeconds
      });

      if (result === 'OK') {
        logger.debug('Lock acquired', { lockKey, lockToken });
        return lockToken;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    } catch (error) {
      logger.error('Failed to acquire lock', { lockKey, error });
    }
  }

  logger.warn('Failed to acquire lock after retries', { lockKey, retries });
  return null;
}

/**
 * Release a distributed lock
 *
 * @param lockKey - Lock key
 * @param lockToken - Lock token from acquisition
 *
 * @example
 * await releaseLock('process:123', lockToken);
 */
export async function releaseLock(lockKey: string, lockToken: string): Promise<void> {
  const client = getRedisClient();

  try {
    // Lua script to ensure we only delete our lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await client.eval(script, {
      keys: [lockKey],
      arguments: [lockToken]
    });

    logger.debug('Lock released', { lockKey });
  } catch (error) {
    logger.error('Failed to release lock', { lockKey, error });
    throw error;
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if rate limit is exceeded
 *
 * @param key - Rate limit key (e.g., 'ratelimit:user:123')
 * @param maxRequests - Maximum requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with allowed status and remaining requests
 *
 * @example
 * const { allowed, remaining } = await checkRateLimit('user:123', 100, 60);
 * if (!allowed) {
 *   throw new Error('Rate limit exceeded');
 * }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const client = getRedisClient();

  try {
    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, windowSeconds);
    }

    const ttl = await client.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    logger.debug('Rate limit checked', {
      key,
      current,
      maxRequests,
      allowed,
      remaining
    });

    return { allowed, remaining, resetAt };
  } catch (error) {
    logger.error('Failed to check rate limit', { key, error });
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: maxRequests, resetAt: new Date() };
  }
}

/**
 * Reset rate limit for a key
 *
 * @param key - Rate limit key
 */
export async function resetRateLimit(key: string): Promise<void> {
  await deleteCache(key);
  logger.debug('Rate limit reset', { key });
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Store session data
 *
 * @param sessionId - Session ID
 * @param data - Session data
 * @param ttlSeconds - Session TTL (default: 24 hours)
 */
export async function setSession(
  sessionId: string,
  data: any,
  ttlSeconds: number = 86400
): Promise<void> {
  const key = `session:${sessionId}`;
  await setCache(key, data, ttlSeconds);
  logger.debug('Session stored', { sessionId });
}

/**
 * Get session data
 *
 * @param sessionId - Session ID
 * @returns Session data or null
 */
export async function getSession<T = any>(sessionId: string): Promise<T | null> {
  const key = `session:${sessionId}`;
  return await getCache<T>(key);
}

/**
 * Delete session
 *
 * @param sessionId - Session ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `session:${sessionId}`;
  await deleteCache(key);
  logger.debug('Session deleted', { sessionId });
}

/**
 * Refresh session TTL
 *
 * @param sessionId - Session ID
 * @param ttlSeconds - New TTL in seconds
 */
export async function refreshSession(
  sessionId: string,
  ttlSeconds: number = 86400
): Promise<void> {
  const client = getRedisClient();
  const key = `session:${sessionId}`;

  try {
    await client.expire(key, ttlSeconds);
    logger.debug('Session refreshed', { sessionId });
  } catch (error) {
    logger.error('Failed to refresh session', { sessionId, error });
    throw error;
  }
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

/**
 * Get cache statistics
 *
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hitRate?: number;
}> {
  const client = getRedisClient();

  try {
    const info = await client.info('stats');
    const dbSize = await client.dbSize();

    // Parse memory info
    const memoryInfo = await client.info('memory');
    const memoryMatch = memoryInfo.match(/used_memory_human:(.+)/);
    const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

    // Parse hit rate if available
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);

    let hitRate: number | undefined;
    if (hitsMatch && missesMatch) {
      const hits = parseInt(hitsMatch[1]);
      const misses = parseInt(missesMatch[1]);
      const total = hits + misses;
      hitRate = total > 0 ? (hits / total) * 100 : 0;
    }

    return {
      keys: dbSize,
      memory,
      hitRate
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    return { keys: 0, memory: 'unknown' };
  }
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  // Initialization
  initializeRedis,
  getRedisClient,
  closeRedis,

  // Basic operations
  setCache,
  getCache,
  deleteCache,
  deleteByPattern,
  existsCache,
  getTTL,

  // Cache-aside pattern
  getOrSet,

  // Distributed locking
  acquireLock,
  releaseLock,

  // Rate limiting
  checkRateLimit,
  resetRateLimit,

  // Session management
  setSession,
  getSession,
  deleteSession,
  refreshSession,

  // Statistics
  getCacheStats
};
