'use server';

/**
 * Rate limiting and account lockout utilities
 * ⚠️ PRODUCTION NOTE: In-memory store won't work across multiple serverless instances.
 * For production, replace with Redis (Upstash recommended).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number; // timestamp in ms
}

interface LockoutRecord {
  lockedUntil: number; // timestamp in ms
  reason: string;
}

// Declare global augmentation for in-memory store (development only)
declare global {
  // eslint-disable-next-line no-var
  var rateLimitStore: Map<string, RateLimitRecord> | undefined;
  // eslint-disable-next-line no-var
  var accountLockStore: Map<string, LockoutRecord> | undefined;
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

/**
 * Account lockout functions
 * Track failed login attempts and lock accounts after threshold
 */

/**
 * Check if account is currently locked
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  'use server';
  let lockStore = globalThis.accountLockStore as Map<string, LockoutRecord> | undefined;
  if (!lockStore) {
    lockStore = new Map();
    globalThis.accountLockStore = lockStore;
  }

  const record = lockStore.get(email);
  if (!record) return false;

  const now = Date.now();
  if (now < record.lockedUntil) {
    return true; // still locked
  }

  // Lock expired, clean up
  lockStore.delete(email);
  return false;
}

/**
 * Get remaining lock time in seconds (0 if not locked)
 */
export async function getLockRemaining(email: string): Promise<number> {
  'use server';
  const lockStore = globalThis.accountLockStore as Map<string, LockoutRecord> | undefined;
  if (!lockStore) return 0;

  const record = lockStore.get(email);
  if (!record) return 0;

  const now = Date.now();
  if (now >= record.lockedUntil) {
    lockStore?.delete(email);
    return 0;
  }

  return Math.ceil((record.lockedUntil - now) / 1000);
}

/**
 * Record a failed login attempt
 * Returns: whether the account is now locked
 */
export async function recordFailedLogin(email: string, maxAttempts: number = 5, lockDurationMs: number = 60 * 60 * 1000): Promise<{
  locked: boolean;
  attempts: number;
  lockRemaining?: number;
}> {
  'use server';

  const key = `failed_login:${email.toLowerCase().trim()}`;

  let rateLimitStore = globalThis.rateLimitStore as Map<string, RateLimitRecord> | undefined;
  if (!rateLimitStore) {
    rateLimitStore = new Map();
    globalThis.rateLimitStore = rateLimitStore;
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // If no record or expired, start fresh
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + (60 * 60 * 1000), // 1 hour window for failures
    });
    return { locked: false, attempts: 1 };
  }

  // Increment failed count
  record.count += 1;
  rateLimitStore.set(key, record);

  // Check if should lock
  if (record.count >= maxAttempts) {
    // Lock the account
    let lockStore = globalThis.accountLockStore as Map<string, LockoutRecord> | undefined;
    if (!lockStore) {
      lockStore = new Map();
      globalThis.accountLockStore = lockStore;
    }

    const lockUntil = now + lockDurationMs;
    lockStore.set(email, {
      lockedUntil: lockUntil,
      reason: `Too many failed login attempts (${record.count})`,
    });

    return {
      locked: true,
      attempts: record.count,
      lockRemaining: lockDurationMs / 1000,
    };
  }

  return { locked: false, attempts: record.count };
}

/**
 * Reset failed login counter on successful authentication
 */
export async function resetFailedLogin(email: string): Promise<void> {
  'use server';
  const key = `failed_login:${email.toLowerCase().trim()}`;
  const rateLimitStore = globalThis.rateLimitStore as Map<string, RateLimitRecord> | undefined;
  if (rateLimitStore) {
    rateLimitStore.delete(key);
  }

  // Also clear any existing lock
  const lockStore = globalThis.accountLockStore as Map<string, LockoutRecord> | undefined;
  if (lockStore) {
    lockStore.delete(email);
  }
}
