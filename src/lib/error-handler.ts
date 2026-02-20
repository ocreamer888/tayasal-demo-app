/**
 * Error response sanitization
 * Prevents leakage of sensitive information in error messages
 *
 * Reference: rules/CYBERSECURITY_MASTERY.md lines 786-807
 */

/**
 * Sanitize error messages for client response
 * In production: return generic message
 * In development: include actual error for debugging
 */
export function getClientErrorMessage(error: unknown, defaultMessage: string = 'Error interno del servidor'): string {
  if (process.env.NODE_ENV !== 'production') {
    // Development: show actual error for debugging
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return defaultMessage;
  }

  // Production: always return generic message
  return defaultMessage;
}

/**
 * Create a sanitized JSON error response
 * Ensures no stack traces or sensitive details are sent to client
 */
export function createErrorResponse(
  error: unknown,
  status: number,
  defaultMessage?: string
): Response {
  const message = getClientErrorMessage(error, defaultMessage);

  // Log full error server-side for debugging
  if (error instanceof Error) {
    console.error(`Error ${status}:`, error.message, error.stack);
  } else {
    console.error(`Error ${status}:`, error);
  }

  return Response.json({ error: message }, { status });
}

/**
 * Wrapper for API route handlers that provides consistent error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('API route error:', error);
    throw error; // Let route handler decide how to respond
  }
}
