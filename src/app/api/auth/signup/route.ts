import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, generateAuthKey } from '@/lib/rate-limit';
import { getClientErrorMessage } from '@/lib/error-handler';
import { logAuditEvent } from '@/lib/audit-logger';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  full_name: z.string().min(2).max(100),
  role: z.enum(['operator', 'engineer', 'admin']),
});

/**
 * POST /api/auth/signup
 * Rate limited: 3 attempts per hour per email, 10 per IP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 });
    }
    const { email, password, full_name, role } = parsed.data;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';

    // Rate limiting
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

    // Auth with Supabase (server-side — session written to HttpOnly cookie)
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    });

    if (error) {
      console.error('Signup failed:', error.message);
      const errorMessage = getClientErrorMessage(
        error,
        'No se pudo crear la cuenta. Por favor, verifica la información e inténtalo de nuevo.'
      );
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    await logAuditEvent({ action: 'signup', userId: data.user?.id, ip });

    return NextResponse.json(
      {
        user: data.user,
        message: 'Cuenta creada exitosamente. Por favor verifica tu correo electrónico.'
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
