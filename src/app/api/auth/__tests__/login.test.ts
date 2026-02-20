import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Module mocks (must be before any imports of the module under test) ---

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  generateAuthKey: vi.fn((type: string, id: string) => `${type}:${id}`),
  isAccountLocked: vi.fn(),
  getLockRemaining: vi.fn(),
  recordFailedLogin: vi.fn(),
  resetFailedLogin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    })
  ),
}));

// --- Imports after mocks ---
import { POST } from '@/app/api/auth/login/route';
import * as rateLimitModule from '@/lib/rate-limit';
import * as serverModule from '@/lib/supabase/server';

// -------------------------------------------------------------------------

const allowedIpLimit = { allowed: true, remaining: 19, resetAt: Date.now() + 900000 };
const blockedIpLimit = { allowed: false, remaining: 0, resetAt: Date.now() + 900000, retryAfter: 900 };

function makeRequest(body: object, ip = '1.2.3.4') {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
  });
}

function mockSupabaseAuth(result: { data?: object; error?: object | null }) {
  const mockClient = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(result),
    },
  };
  vi.mocked(serverModule.createSupabaseServerClient).mockResolvedValue(mockClient as never);
  return mockClient;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimitModule.isAccountLocked).mockResolvedValue(false);
    vi.mocked(rateLimitModule.getLockRemaining).mockResolvedValue(0);
    vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue(allowedIpLimit);
    vi.mocked(rateLimitModule.recordFailedLogin).mockResolvedValue({ locked: false, attempts: 1 });
    vi.mocked(rateLimitModule.resetFailedLogin).mockResolvedValue(undefined);
  });

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ password: 'password123456' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const req = makeRequest({ email: 'test@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const req = makeRequest({ email: 'not-an-email', password: 'password123456' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when account is locked', async () => {
    vi.mocked(rateLimitModule.isAccountLocked).mockResolvedValue(true);
    vi.mocked(rateLimitModule.getLockRemaining).mockResolvedValue(3600);

    const req = makeRequest({ email: 'test@example.com', password: 'pass1' });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(res.headers.get('Retry-After')).toBe('3600');
    const body = await res.json();
    expect(body.locked).toBe(true);
  });

  it('returns 429 when IP is rate limited, with Retry-After header', async () => {
    vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue(blockedIpLimit);

    const req = makeRequest({ email: 'test@example.com', password: 'pass1' });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('900');
  });

  it('returns 401 on wrong credentials', async () => {
    mockSupabaseAuth({ data: {}, error: { message: 'Invalid login credentials' } });

    const req = makeRequest({ email: 'test@example.com', password: 'wrongpassword' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.attempts).toBe(1);
  });

  it('returns 200 on successful login', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabaseAuth({ data: { user: mockUser, session: {} }, error: null });

    const req = makeRequest({ email: 'test@example.com', password: 'correctpassword' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(mockUser);
    expect(body.message).toBeDefined();
    // Session must NOT be in response (it's in the HttpOnly cookie now)
    expect(body.session).toBeUndefined();
  });

  it('resets failed login counter on success', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabaseAuth({ data: { user: mockUser, session: {} }, error: null });

    const req = makeRequest({ email: 'test@example.com', password: 'correctpassword' });
    await POST(req);
    expect(rateLimitModule.resetFailedLogin).toHaveBeenCalledOnce();
  });
});
