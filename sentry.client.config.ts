import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Reduce noise in development
  enabled: process.env.NODE_ENV === 'production',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust in production as traffic grows.
  tracesSampleRate: 0.1,

  // Capture Replay for 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
