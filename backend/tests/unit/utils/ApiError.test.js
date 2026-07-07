import { describe, it, expect } from 'vitest';
import { ApiError } from '../../../src/utils/ApiError.js';

describe('ApiError', () => {
  describe('constructor', () => {
    it('creates an instance with the correct properties', () => {
      const err = new ApiError(404, 'NOT_FOUND', 'Resource not found');

      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(Error);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Resource not found');
      expect(err.isOperational).toBe(true);
    });

    it('defaults isOperational to true', () => {
      const err = new ApiError(400, 'BAD_REQUEST', 'Bad input');
      expect(err.isOperational).toBe(true);
    });

    it('accepts isOperational=false for programmer errors', () => {
      const err = new ApiError(500, 'INTERNAL_ERROR', 'Crash', false);
      expect(err.isOperational).toBe(false);
    });

    it('sets the error name to ApiError', () => {
      const err = new ApiError(500, 'ERR', 'msg');
      expect(err.name).toBe('ApiError');
    });

    it('preserves prototype chain for instanceof checks', () => {
      const err = new ApiError(400, 'BAD', 'msg');
      expect(err instanceof Error).toBe(true);
      expect(err instanceof ApiError).toBe(true);
    });
  });

  describe('factory helpers', () => {
    it('badRequest creates a 400 error', () => {
      const err = ApiError.badRequest('Invalid email');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid email');
    });

    it('badRequest accepts a custom code', () => {
      const err = ApiError.badRequest('Invalid email', 'INVALID_EMAIL');
      expect(err.code).toBe('INVALID_EMAIL');
    });

    it('unauthorized creates a 401 error with defaults', () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Authentication required');
    });

    it('forbidden creates a 403 error', () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('notFound creates a 404 error with resource name', () => {
      const err = ApiError.notFound('Document');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Document not found');
      expect(err.code).toBe('NOT_FOUND');
    });

    it('notFound accepts a custom code', () => {
      const err = ApiError.notFound('Document', 'DOCUMENT_NOT_FOUND');
      expect(err.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('conflict creates a 409 error', () => {
      const err = ApiError.conflict('Email already in use', 'EMAIL_TAKEN');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('EMAIL_TAKEN');
    });

    it('tooManyRequests creates a 429 error', () => {
      const err = ApiError.tooManyRequests();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMITED');
    });

    it('internal creates a 500 error marked non-operational', () => {
      const err = ApiError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(false);
    });
  });
});
