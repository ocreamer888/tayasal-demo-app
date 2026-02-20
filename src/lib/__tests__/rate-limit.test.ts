import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted so the mock is available before vi.mock factory runs
const { mockAdminClient } = vi.hoisted(() => {
  const mockAdminClient = { from: vi.fn() };
  return { mockAdminClient };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

// Helper to build chainable query mock
function buildQueryChain(resolvedData: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'update', 'delete', 'upsert'];
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  return chain;
}

import {
  checkRateLimit,
  generateAuthKey,
  isAccountLocked,
  getLockRemaining,
  recordFailedLogin,
  resetFailedLogin,
} from '@/lib/rate-limit';

describe('generateAuthKey', () => {
  it('generates namespaced keys', () => {
    expect(generateAuthKey('login', 'test@example.com')).toBe('login:test@example.com');
    expect(generateAuthKey('signup', 'IP:1.2.3.4')).toBe('signup:ip:1.2.3.4');
  });

  it('lowercases and trims input', () => {
    expect(generateAuthKey('login', '  USER@TEST.COM  ')).toBe('login:user@test.com');
  });
});

describe('checkRateLimit', () => {
  const key = 'login:ip:1.2.3.4';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows first request (no existing record)', async () => {
    const chain = buildQueryChain(null);
    mockAdminClient.from.mockReturnValue(chain);

    const result = await checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('allows when count is below max', async () => {
    const resetAt = Date.now() + 60000;
    const chain = buildQueryChain({ count: 2, reset_at: resetAt });
    mockAdminClient.from.mockReturnValue(chain);

    const result = await checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 2 - 1
  });

  it('blocks when count equals max', async () => {
    const resetAt = Date.now() + 60000;
    const chain = buildQueryChain({ count: 5, reset_at: resetAt });
    mockAdminClient.from.mockReturnValue(chain);

    const result = await checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets counter when window has expired', async () => {
    const expiredResetAt = Date.now() - 1000;
    const chain = buildQueryChain({ count: 5, reset_at: expiredResetAt });
    mockAdminClient.from.mockReturnValue(chain);

    const result = await checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
  });
});

describe('isAccountLocked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when no lock record exists', async () => {
    const chain = buildQueryChain(null);
    mockAdminClient.from.mockReturnValue(chain);

    expect(await isAccountLocked('user@test.com')).toBe(false);
  });

  it('returns true when locked_until is in the future', async () => {
    const lockedUntil = Date.now() + 3600000;
    const chain = buildQueryChain({ locked_until: lockedUntil });
    mockAdminClient.from.mockReturnValue(chain);

    expect(await isAccountLocked('user@test.com')).toBe(true);
  });

  it('returns false when lock has expired', async () => {
    const expiredLock = Date.now() - 1000;
    const chain = buildQueryChain({ locked_until: expiredLock });
    mockAdminClient.from.mockReturnValue(chain);

    expect(await isAccountLocked('user@test.com')).toBe(false);
  });
});

describe('getLockRemaining', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 when not locked', async () => {
    const chain = buildQueryChain(null);
    mockAdminClient.from.mockReturnValue(chain);

    expect(await getLockRemaining('user@test.com')).toBe(0);
  });

  it('returns remaining seconds when locked', async () => {
    const lockedUntil = Date.now() + 3600000;
    const chain = buildQueryChain({ locked_until: lockedUntil });
    mockAdminClient.from.mockReturnValue(chain);

    const remaining = await getLockRemaining('user@test.com');
    expect(remaining).toBeGreaterThan(3599);
    expect(remaining).toBeLessThanOrEqual(3600);
  });
});

describe('recordFailedLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns locked: false for first failure', async () => {
    const chain = buildQueryChain(null);
    mockAdminClient.from.mockReturnValue(chain);

    const result = await recordFailedLogin('user@test.com');
    expect(result.locked).toBe(false);
    expect(result.attempts).toBe(1);
  });

  it('locks account after maxAttempts failures', async () => {
    const resetAt = Date.now() + 3600000;
    // count: 4 → after increment = 5 → triggers lock
    const chain = buildQueryChain({ count: 4, reset_at: resetAt });
    mockAdminClient.from.mockReturnValue(chain);

    const result = await recordFailedLogin('user@test.com', 5);
    expect(result.locked).toBe(true);
    expect(result.attempts).toBe(5);
    expect(result.lockRemaining).toBeDefined();
  });
});

describe('resetFailedLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls delete on both the failure record and the lock record', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockAdminClient.from.mockReturnValue(chain);

    await resetFailedLogin('user@test.com');
    expect(mockAdminClient.from).toHaveBeenCalledTimes(2);
  });
});
