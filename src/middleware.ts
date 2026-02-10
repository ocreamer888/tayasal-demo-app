import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Headers Middleware
 *
 * Applies essential security headers to all pages (excluding static assets and API routes).
 * Implements OWASP-recommended protections against:
 * - Clickjacking (X-Frame-Options)
 * - MIME-sniffing (X-Content-Type-Options)
 * - Referrer leakage (Referrer-Policy)
 * - Unnecessary browser features (Permissions-Policy)
 * - XSS (Content-Security-Policy)
 * - SSL stripping (Strict-Transport-Security in production)
 *
 * Reference: rules/CYBERSECURITY_MASTERY.md lines 716-784
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Clickjacking protection - prevent embedding in iframes
  response.headers.set('X-Frame-Options', 'DENY');

  // 2. MIME-sniffing protection - prevent browser from guessing content type
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 3. Referrer Policy - control referrer information sent to other sites
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 4. Permissions Policy - disable unused browser APIs (privacy/security)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), battery=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()'
  );

  // 5. Content Security Policy - mitigate XSS (start permissive, tighten later)
  // Allows self resources + inline styles (required for some UI libs)
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://cwcxdhsajdmeaaiyocli.supabase.co wss://cwcxdhsajdmeaaiyocli.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  // 6. HSTS (HTTP Strict Transport Security) - enforce HTTPS in production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
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
