import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, generateAuthKey, isAccountLocked, getLockRemaining, recordFailedLogin, resetFailedLogin } from '@/lib/rate-limit';
import { getClientErrorMessage } from '@/lib/error-handler';

/**
 * POST /api/auth/login
 * Security: Rate limit (5 email/15min, 20 IP/15min) + Account lockout (5 fails → 1h)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

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
        { status: 429 }
      );
    }

    // Auth with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Record failed attempt (may trigger lockout)
      const failResult = await recordFailedLogin(email);
      console.error(`Login failed for ${email}: ${error.message} (attempts: ${failResult.attempts})`);

      // If account just got locked, return lockout message
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

    // Successful login: reset failed counter and any lock
    await resetFailedLogin(email);

    // Return session data
    return NextResponse.json(
      { user: data.user, session: data.session, message: 'Inicio de sesión exitoso' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
