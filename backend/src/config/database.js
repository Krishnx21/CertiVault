/**
 * database.js — MongoDB connection management via Mongoose.
 *
 * Provides connect() and disconnect() functions used by server.js
 * on startup and graceful shutdown respectively.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import env from './env.js';

/**
 * Connect to MongoDB Atlas (or local instance).
 * Mongoose maintains the connection pool automatically.
 */
export async function connect() {
  await mongoose.connect(env.MONGODB_URI, {
    // Recommended production options
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  logger.info({ uri: redactUri(env.MONGODB_URI) }, 'MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

/**
 * Gracefully close the Mongoose connection.
 */
export async function disconnect() {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

/**
 * Remove credentials from a MongoDB URI for safe logging.
 * @param {string} uri
 * @returns {string}
 */
function redactUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '[invalid URI]';
  }
}
