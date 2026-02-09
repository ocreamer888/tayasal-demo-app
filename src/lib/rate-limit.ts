'use server';

/**
 * Rate limiter using in-memory Map (development only)
 * ⚠️ PRODUCTION NOTE: This is not distributed and won't work across multiple serverless instances.
 * For production, replace the store with Redis (Upstash recommended). See task #25 docs.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number; // timestamp in ms
}

// Declare global augmentation for in-memory store (development only)
declare global {
  // eslint-disable-next-line no-var
  var rateLimitStore: Map<string, RateLimitRecord> | undefined;
}

/**
 * Check if request is within rate limit
 * @param key - Unique identifier (IP, email, or combination)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}> {
  'use server';

  // Initialize in-memory store (in production, use Redis)
  // This is a simple implementation; for production use a proper Redis store
  let rateLimitStore = globalThis.rateLimitStore as Map<string, RateLimitRecord> | undefined;
  if (!rateLimitStore) {
    rateLimitStore = new Map();
    globalThis.rateLimitStore = rateLimitStore;
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // If no record or expired, create new
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: now + windowMs,
    };
  }

  // Record exists and is valid
  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Generate rate limit key from request data
 */
export function generateAuthKey(type: 'login' | 'signup', identifier: string): string {
  return `${type}:${identifier.toLowerCase().trim()}`;
}
