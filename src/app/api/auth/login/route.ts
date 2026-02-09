import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, generateAuthKey } from '@/lib/rate-limit';

/**
 * POST /api/auth/login
 * Rate limited: 5 attempts per 15 minutes per email, 20 per IP
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

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const emailLimit = await checkRateLimit(generateAuthKey('login', email), 5, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espere antes de reintentar.', retryAfter: emailLimit.retryAfter || 900 },
        { status: 429 }
      );
    }

    const ipLimit = await checkRateLimit(generateAuthKey('login', `ip:${ip}`), 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos desde esta IP.', retryAfter: ipLimit.retryAfter || 900 },
        { status: 429 }
      );
    }

    // Auth with Supabase (server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`Login failed for ${email}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Return session data for client to set
    return NextResponse.json(
      { user: data.user, session: data.session, message: 'Inicio de sesión exitoso' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
