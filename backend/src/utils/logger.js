/**
 * logger.js — Structured JSON logger using pino.
 *
 * In development, pino-pretty formats logs for human readability.
 * In production and test, logs are emitted as newline-delimited JSON.
 *
 * Usage:
 *   import logger from '../utils/logger.js';
 *   logger.info({ requestId }, 'Request received');
 *   logger.error({ err }, 'Something went wrong');
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redact sensitive fields from log output
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.passwordHash',
      'body.token',
      'body.refreshToken',
    ],
    censor: '[REDACTED]',
  },

  // Human-readable output in development only
  transport: isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});

export default logger;
