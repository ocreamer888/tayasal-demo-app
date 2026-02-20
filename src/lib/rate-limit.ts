/**
 * Rate limiting and account lockout utilities — Supabase-backed (distributed)
 *
 * Uses the `rate_limit_records` table to persist state across serverless instances.
 * Requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS on this table.
 *
 * Expected table schema:
 *   key TEXT PRIMARY KEY
 *   count INTEGER NOT NULL DEFAULT 0
 *   reset_at BIGINT NOT NULL DEFAULT 0   -- Unix ms timestamp
 *   locked_until BIGINT NOT NULL DEFAULT 0
 *   lock_reason TEXT
 *   updated_at TIMESTAMPTZ DEFAULT now()
 */

import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS; never expose to the browser
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if request is within rate limit and increment the counter.
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

  const now = Date.now();
  const newResetAt = now + windowMs;

  // Fetch existing record
  const { data: existing } = await adminClient
    .from('rate_limit_records')
    .select('count, reset_at')
    .eq('key', key)
    .maybeSingle();

  // New window or no record — reset counter
  if (!existing || now > Number(existing.reset_at)) {
    await adminClient.from('rate_limit_records').upsert(
      { key, count: 1, reset_at: newResetAt, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    return { allowed: true, remaining: maxAttempts - 1, resetAt: newResetAt };
  }

  // Already at limit — reject
  if (existing.count >= maxAttempts) {
    const retryAfter = Math.ceil((Number(existing.reset_at) - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: Number(existing.reset_at),
      retryAfter,
    };
  }

  // Increment counter
  await adminClient
    .from('rate_limit_records')
    .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
    .eq('key', key);

  return {
    allowed: true,
    remaining: maxAttempts - existing.count - 1,
    resetAt: Number(existing.reset_at),
  };
}

/**
 * Generate a namespaced rate limit key.
 */
export function generateAuthKey(type: 'login' | 'signup', identifier: string): string {
  return `${type}:${identifier.toLowerCase().trim()}`;
}

/**
 * Check if account is currently locked.
 */
export async function isAccountLocked(email: string): Promise<boolean> {

  const key = `lock:${email.toLowerCase().trim()}`;
  const { data } = await adminClient
    .from('rate_limit_records')
    .select('locked_until')
    .eq('key', key)
    .maybeSingle();

  if (!data || !data.locked_until) return false;

  const now = Date.now();
  if (now < Number(data.locked_until)) return true;

  // Lock expired — clear it
  await adminClient
    .from('rate_limit_records')
    .update({ locked_until: 0, lock_reason: null, updated_at: new Date().toISOString() })
    .eq('key', key);

  return false;
}

/**
 * Get remaining lock time in seconds (0 if not locked).
 */
export async function getLockRemaining(email: string): Promise<number> {

  const key = `lock:${email.toLowerCase().trim()}`;
  const { data } = await adminClient
    .from('rate_limit_records')
    .select('locked_until')
    .eq('key', key)
    .maybeSingle();

  if (!data || !data.locked_until) return 0;

  const now = Date.now();
  const remaining = Number(data.locked_until) - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Record a failed login attempt. Locks the account after maxAttempts failures.
 */
export async function recordFailedLogin(
  email: string,
  maxAttempts: number = 5,
  lockDurationMs: number = 60 * 60 * 1000
): Promise<{
  locked: boolean;
  attempts: number;
  lockRemaining?: number;
}> {

  const failKey = `failed_login:${email.toLowerCase().trim()}`;
  const lockKey = `lock:${email.toLowerCase().trim()}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window

  // Fetch existing failure record
  const { data: existing } = await adminClient
    .from('rate_limit_records')
    .select('count, reset_at')
    .eq('key', failKey)
    .maybeSingle();

  let newCount: number;

  if (!existing || now > Number(existing.reset_at)) {
    newCount = 1;
    await adminClient.from('rate_limit_records').upsert(
      { key: failKey, count: 1, reset_at: now + windowMs, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  } else {
    newCount = existing.count + 1;
    await adminClient
      .from('rate_limit_records')
      .update({ count: newCount, updated_at: new Date().toISOString() })
      .eq('key', failKey);
  }

  // Lock account if threshold reached
  if (newCount >= maxAttempts) {
    const lockUntil = now + lockDurationMs;
    await adminClient.from('rate_limit_records').upsert(
      {
        key: lockKey,
        count: newCount,
        reset_at: lockUntil,
        locked_until: lockUntil,
        lock_reason: `Too many failed login attempts (${newCount})`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    return {
      locked: true,
      attempts: newCount,
      lockRemaining: lockDurationMs / 1000,
    };
  }

  return { locked: false, attempts: newCount };
}

/**
 * Reset failed login counter and any account lock on successful authentication.
 */
export async function resetFailedLogin(email: string): Promise<void> {

  const failKey = `failed_login:${email.toLowerCase().trim()}`;
  const lockKey = `lock:${email.toLowerCase().trim()}`;

  await Promise.all([
    adminClient.from('rate_limit_records').delete().eq('key', failKey),
    adminClient.from('rate_limit_records').delete().eq('key', lockKey),
  ]);
}
