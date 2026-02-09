import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, generateAuthKey } from '@/lib/rate-limit';

/**
 * POST /api/auth/signup
 * Rate limited: 3 attempts per hour per email, 10 per IP
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (!['operator', 'engineer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const emailLimit = await checkRateLimit(generateAuthKey('signup', email), 3, 60 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro con este correo.', retryAfter: emailLimit.retryAfter || 3600 },
        { status: 429 }
      );
    }

    const ipLimit = await checkRateLimit(generateAuthKey('signup', `ip:${ip}`), 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro desde esta IP.', retryAfter: ipLimit.retryAfter || 3600 },
        { status: 429 }
      );
    }

    // Auth with Supabase (server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    });

    if (error) {
      console.error(`Signup failed for ${email}: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return session data for client to set (if confirmed immediately)
    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: 'Cuenta creada exitosamente. Por favor verifica tu correo electrónico.'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
