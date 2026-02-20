import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings in CI
  silent: !process.env.CI,

  // Disable Sentry telemetry
  telemetry: false,

  // Only upload source maps in production
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },
});
