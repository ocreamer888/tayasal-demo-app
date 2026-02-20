import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Module mocks ---

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  generateAuthKey: vi.fn((type: string, id: string) => `${type}:${id}`),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/error-handler', () => ({
  getClientErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    })
  ),
}));

// --- Imports ---
import { POST } from '@/app/api/auth/signup/route';
import * as rateLimitModule from '@/lib/rate-limit';
import * as serverModule from '@/lib/supabase/server';

// -------------------------------------------------------------------------

const allowedLimit = { allowed: true, remaining: 9, resetAt: Date.now() + 3600000 };
const blockedLimit = { allowed: false, remaining: 0, resetAt: Date.now() + 3600000, retryAfter: 3600 };

function makeRequest(body: object, ip = '1.2.3.4') {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
  });
}

const validBody = {
  email: 'newuser@example.com',
  password: 'strongpassword123',
  full_name: 'New User',
  role: 'operator',
};

function mockSupabaseAuth(result: { data?: object; error?: object | null }) {
  const mockClient = {
    auth: {
      signUp: vi.fn().mockResolvedValue(result),
    },
  };
  vi.mocked(serverModule.createSupabaseServerClient).mockResolvedValue(mockClient as never);
  return mockClient;
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ password: 'strongpassword123', full_name: 'Test', role: 'operator' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short (< 12 chars)', async () => {
    const req = makeRequest({ ...validBody, password: 'short' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role', async () => {
    const req = makeRequest({ ...validBody, role: 'superadmin' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when full_name is too short', async () => {
    const req = makeRequest({ ...validBody, full_name: 'A' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when email rate limit is exceeded', async () => {
    vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue(blockedLimit);
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 429 when IP rate limit is exceeded', async () => {
    vi.mocked(rateLimitModule.checkRateLimit)
      .mockResolvedValueOnce(allowedLimit)
      .mockResolvedValueOnce(blockedLimit);

    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 201 on successful signup', async () => {
    vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue(allowedLimit);
    const mockUser = { id: 'new-user-123', email: 'newuser@example.com' };
    mockSupabaseAuth({ data: { user: mockUser, session: null }, error: null });

    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user).toEqual(mockUser);
    expect(body.message).toBeDefined();
  });

  it('accepts all valid roles', async () => {
    for (const role of ['operator', 'engineer', 'admin']) {
      vi.resetAllMocks();
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue(allowedLimit);
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      mockSupabaseAuth({ data: { user: mockUser, session: null }, error: null });

      const req = makeRequest({ ...validBody, role });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });
});
