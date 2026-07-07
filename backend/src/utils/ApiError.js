/**
 * ApiError.js — Custom error class for operational API errors.
 *
 * Distinguishes between programmer errors (unexpected) and operational
 * errors (expected, e.g. "document not found") so the error handler
 * can respond appropriately.
 *
 * Usage:
 *   throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
 *   throw ApiError.unauthorized();
 *   throw ApiError.forbidden();
 */

export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 404, 400, 403)
   * @param {string} code       - Machine-readable error code (e.g. 'DOCUMENT_NOT_FOUND')
   * @param {string} message    - Human-readable message
   * @param {boolean} [isOperational=true] - True for expected API errors; false for bugs
   */
  constructor(statusCode, code, message, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ─── Factory helpers ─────────────────────────────────────────────────────

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new ApiError(400, code, message);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static notFound(resource = 'Resource', code) {
    return new ApiError(404, code || 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, code, message);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, code, message, false);
  }
}
