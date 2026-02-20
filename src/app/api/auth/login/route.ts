import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, generateAuthKey, isAccountLocked, getLockRemaining, recordFailedLogin, resetFailedLogin } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit-logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Security: Zod validation + Rate limit (20 IP/15min) + Account lockout (5 fails → 1h)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 });
    }
    const { email, password } = parsed.data;

    // Check account lockout first (before revealing account exists)
    const locked = await isAccountLocked(email);
    if (locked) {
      const remaining = await getLockRemaining(email);
      return NextResponse.json(
        {
          error: 'Cuenta bloqueada temporalmente debido a múltiples intentos fallidos.',
          locked: true,
          unlockIn: remaining,
        },
        { status: 403, headers: { 'Retry-After': String(remaining || 3600) } }
      );
    }

    // Rate limiting (IP-based only before auth to avoid account enumeration)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const ipLimit = await checkRateLimit(generateAuthKey('login', `ip:${ip}`), 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos desde esta IP.', retryAfter: ipLimit.retryAfter || 900 },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter || 900) } }
      );
    }

    // Auth with Supabase (server-side — session written to HttpOnly cookie)
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const failResult = await recordFailedLogin(email);
      console.error('Login failed:', error.message, 'attempts:', failResult.attempts);
      await logAuditEvent({ action: 'login_failed', ip, metadata: { attempts: failResult.attempts } });

      if (failResult.locked) {
        return NextResponse.json(
          {
            error: 'Cuenta bloqueada por demasiados intentos fallidos.',
            locked: true,
            unlockIn: failResult.lockRemaining,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Credenciales incorrectas', attempts: failResult.attempts },
        { status: 401 }
      );
    }

    // Successful login: reset failed counter and log the event
    await resetFailedLogin(email);
    await logAuditEvent({ action: 'login', userId: data.user?.id, ip });

    // Session is set via HttpOnly cookie by the server client — no raw session in response
    return NextResponse.json(
      { user: data.user, message: 'Inicio de sesión exitoso' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
