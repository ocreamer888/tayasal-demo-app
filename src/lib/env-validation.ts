import { z } from 'zod';

/**
 * Environment variables validation schema
 * All required environment variables must be defined and non-empty.
 *
 * Reference: rules/CYBERSECURITY_MASTERY.md lines 810-829
 */

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase configuration (required for all environments)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().nonempty('Supabase URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Required for server-side admin operations (rate limiting, audit logging)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Optional: Site URL and error monitoring
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().or(z.literal('')),
  SENTRY_DSN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws error if validation fails - app will fail to start
 */
export function validateEnv(): void {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    // Zod v4 uses .issues instead of .errors
    const issues = result.error.issues;
    const errors = issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(
      `❌ Missing or invalid environment variables:\n${errors}\n\nPlease check your .env.local file and restart the server.`
    );
  }

}

/**
 * Get validated environment (call after validateEnv())
 */
export function getEnv(): Env {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  };
}
