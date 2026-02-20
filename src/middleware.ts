import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Headers Middleware
 *
 * Refreshes Supabase session cookies and applies security headers on every request.
 * Implements OWASP-recommended protections against:
 * - Clickjacking (X-Frame-Options)
 * - MIME-sniffing (X-Content-Type-Options)
 * - Referrer leakage (Referrer-Policy)
 * - Unnecessary browser features (Permissions-Policy)
 * - XSS (Content-Security-Policy)
 * - SSL stripping (Strict-Transport-Security in production)
 */

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Session refresh: keeps HttpOnly session cookie alive on every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  await supabase.auth.getUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseHost = supabaseUrl.replace('https://', '');

  // 1. Clickjacking protection
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');

  // 2. MIME-sniffing protection
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');

  // 3. Referrer Policy
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 4. Permissions Policy
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), battery=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()'
  );

  // 5. Content Security Policy — no unsafe-eval; Tailwind/shadcn require unsafe-inline on styles only
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; connect-src 'self' ${supabaseUrl} wss://${supabaseHost}; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`
  );

  // 6. HSTS — enforce HTTPS in production only
  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return supabaseResponse;
}

/**
 * Configure which routes the middleware runs on
 * - Matcher: all pages except Next.js internals and static assets
 * - API routes are included (they benefit from headers too, except CSP which may need adjustment)
 */
export const config = {
  matcher: [
    // Run on all pages except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
