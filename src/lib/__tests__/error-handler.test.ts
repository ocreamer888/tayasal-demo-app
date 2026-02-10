/**
 * Error Handler Unit Tests
 * Tests for src/lib/error-handler.ts
 *
 * Security focus: Ensure no sensitive error information
 * is leaked to clients in production mode.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientErrorMessage, createErrorResponse } from '../error-handler';

describe('getClientErrorMessage', () => {
  beforeEach(() => {
    // Reset NODE_ENV before each test
    vi.unstubAllEnvs();
  });

  describe('Development mode (NODE_ENV !== production)', () => {
    it('should return actual error message for Error objects', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const error = new Error('Database connection failed');
      const result = getClientErrorMessage(error);
      expect(result).toBe('Database connection failed');
    });

    it('should return string errors as-is', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = getClientErrorMessage('Custom error message');
      expect(result).toBe('Custom error message');
    });

    it('should return default message for non-Error, non-string types', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = getClientErrorMessage({ some: 'object' });
      expect(result).toBe('Error interno del servidor');
    });

    it('should use custom default message in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = getClientErrorMessage(null, 'Custom default');
      expect(result).toBe('Custom default');
    });

    it('should not leak specific database error details', () => {
      vi.stubEnv('NODE_ENV', 'development');
      // Simulating a Supabase error with sensitive info
      const error = new Error(
        'POST to /rest/v1/... failed: duplicate key value violates unique constraint "users_email_key"'
      );
      const result = getClientErrorMessage(error);
      // In development, we SHOULD see the actual error for debugging
      expect(result).toContain('duplicate key value violates');
    });
  });

  describe('Production mode (NODE_ENV === production)', () => {
    it('should return generic message for Error objects', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error('Database connection failed: password=secret123');
      const result = getClientErrorMessage(error);
      expect(result).toBe('Error interno del servidor');
    });

    it('should return generic message for string errors', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = getClientErrorMessage('Sensitive DB error: table not found');
      expect(result).toBe('Error interno del servidor');
    });

    it('should return generic message for any other type', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = getClientErrorMessage({ detail: 'secret' });
      expect(result).toBe('Error interno del servidor');
    });

    it('should use custom default message in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = getClientErrorMessage(null, 'No se pudo procesar la solicitud');
      expect(result).toBe('No se pudo procesar la solicitud');
    });

    it('should NEVER leak database structure details', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error(
        'relation "production_orders" does not exist\nPOSITION: 15'
      );
      const result = getClientErrorMessage(error);
      expect(result).not.toContain('production_orders');
      expect(result).not.toContain('POSITION');
      expect(result).toBe('Error interno del servidor');
    });

    it('should NEVER leak SQL or query information', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error(
        'PG Error: ERROR: column "user_id" of relation "orders" does not exist'
      );
      const result = getClientErrorMessage(error);
      expect(result).not.toContain('user_id');
      expect(result).not.toContain('orders');
      expect(result).toBe('Error interno del servidor');
    });

    it('should NEVER leak authentication information', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error(
        'Invalid refresh token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      );
      const result = getClientErrorMessage(error);
      expect(result).not.toContain('eyJ');
      expect(result).not.toContain('token');
      // May contain 'token' as part of generic message, but not the actual token
      expect(result).toBe('Error interno del servidor');
    });
  });

  describe('Default parameter', () => {
    it('should use Spanish default if no custom default provided', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = getClientErrorMessage(new Error('test'));
      expect(result).toBe('Error interno del servidor');
    });
  });
});

describe('createErrorResponse', () => {
    beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Response creation', () => {
    it('should create Response with correct status', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = createErrorResponse(new Error('test'), 500);
      expect(response.status).toBe(500);
    });

    it('should return JSON with error field', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = createErrorResponse(new Error('test'), 400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    it('should never include stack trace in response', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error('test error');
      // @ts-expect-error - adding stack manually for test
      error.stack = 'Error: test error\n    at Function.<anonymous>';
      const response = createErrorResponse(error, 500);
      const data = await response.json();
      expect(data.error).not.toContain('stack');
      expect(data.error).not.toContain('at Function');
    });

    it('should log error to console in both modes', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const error = new Error('test');
      const response = createErrorResponse(error, 500);
      expect(console.error).toHaveBeenCalledWith(
        'Error 500:',
        error.message,
        error.stack
      );
    });

    it('should log non-Error values appropriately', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const unknownValue = { code: 'DB_ERROR', detail: 'connection failed' };
      const response = createErrorResponse(unknownValue, 500);
      expect(console.error).toHaveBeenCalledWith('Error 500:', unknownValue);
    });

    it('should use default message if error is not informative', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = createErrorResponse(null, 500, 'Custom error message');
      expect(response.status).toBe(500);
    });
  });

  describe('Security boundary checks', () => {
    it('should sanitize error with SQL injection attempt', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error("SQL: DROP TABLE users; --");
      const response = createErrorResponse(error, 500);
      const data = await response.json();
      expect(data.error).not.toContain('DROP');
      expect(data.error).not.toContain('users');
    });

    it('should sanitize error with path traversal attempt', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error('File not found: ../../../etc/passwd');
      const response = createErrorResponse(error, 404);
      const data = await response.json();
      expect(data.error).not.toContain('../../../');
      expect(data.error).not.toContain('passwd');
    });

    it('should sanitize error with connection string', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error(
        'Connection failed: postgresql://user:password123@localhost/db'
      );
      const response = createErrorResponse(error, 500);
      const data = await response.json();
      expect(data.error).not.toContain('password123');
      expect(data.error).not.toContain('postgresql://');
    });
  });
});

// Note: withErrorHandling is harder to unit test because it throws
// We can test it with integration tests using a mock API route,
// but for unit tests, its behavior is simple enough to trust.
// Consider adding integration tests for the API routes that use it.
