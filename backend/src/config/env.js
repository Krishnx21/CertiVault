/**
 * env.js — Environment variable validation.
 *
 * Reads and validates all required configuration at startup.
 * Fails fast with a clear error message if anything is missing,
 * preventing the server from starting in an unconfigured state.
 */

import 'dotenv/config';

/**
 * Assert that a required environment variable is set and non-empty.
 * @param {string} name - The environment variable name.
 * @returns {string} The value of the environment variable.
 */
function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Return an optional environment variable, or a default value.
 * @param {string} name
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(name, defaultValue) {
  return process.env[name]?.trim() || defaultValue;
}

const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  CLIENT_ORIGIN: optional('CLIENT_ORIGIN', 'http://localhost:5173'),

  MONGODB_URI: required('MONGODB_URI'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ISSUER: optional('JWT_ISSUER', 'certivault-api'),
  JWT_AUDIENCE: optional('JWT_AUDIENCE', 'certivault-web'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  AWS_REGION: optional('AWS_REGION', ''),
  S3_BUCKET_NAME: optional('S3_BUCKET_NAME', ''),

  MAX_UPLOAD_BYTES: parseInt(optional('MAX_UPLOAD_BYTES', '10485760'), 10),

  LOG_LEVEL: optional('LOG_LEVEL', 'info'),

  get isProduction() {
    return this.NODE_ENV === 'production';
  },

  get isTest() {
    return this.NODE_ENV === 'test';
  },
};

export default env;
