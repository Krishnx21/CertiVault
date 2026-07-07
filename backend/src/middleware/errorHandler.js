/**
 * errorHandler.js — Centralised Express error-handling middleware.
 *
 * Must be registered LAST in the Express middleware chain (after all routes).
 * Normalises all errors into the standard API error shape and hides
 * implementation details from clients in production.
 *
 * Standard error response:
 * {
 *   "error": {
 *     "code": "DOCUMENT_NOT_FOUND",
 *     "message": "Document not found",
 *     "requestId": "abc-123"
 *   }
 * }
 */

import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || 'unknown';

  // ── Normalise known error types ─────────────────────────────────────────

  let apiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    // Mongoose schema validation failure
    apiError = new ApiError(400, 'VALIDATION_ERROR', err.message);
  } else if (err.code === 11000) {
    // MongoDB duplicate key
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    apiError = new ApiError(409, 'DUPLICATE_KEY', `A record with this ${field} already exists`);
  } else if (err.name === 'CastError') {
    // Mongoose invalid ObjectId
    apiError = new ApiError(400, 'INVALID_ID', 'The provided ID is not valid');
  } else {
    // Unexpected / programmer error — do not expose details in production
    apiError = new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', false);
  }

  // ── Log the error ────────────────────────────────────────────────────────

  const logPayload = { requestId, statusCode: apiError.statusCode, code: apiError.code };

  if (apiError.isOperational) {
    logger.warn({ ...logPayload, err }, 'Operational error');
  } else {
    logger.error({ ...logPayload, err }, 'Unexpected error');
  }

  // ── Build response ───────────────────────────────────────────────────────

  const body = {
    error: {
      code: apiError.code,
      message: apiError.message,
      requestId,
    },
  };

  // In development, include the stack trace for faster debugging
  if (!env.isProduction && !apiError.isOperational) {
    body.error.stack = err.stack;
  }

  res.status(apiError.statusCode).json(body);
};

export default errorHandler;
