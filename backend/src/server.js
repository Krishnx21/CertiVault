/**
 * server.js — HTTP server entry point.
 *
 * Responsibilities:
 * - Validate environment (via env.js import — fails fast if misconfigured)
 * - Connect to MongoDB
 * - Start the HTTP server
 * - Handle graceful shutdown on SIGTERM and SIGINT
 */

import env from './config/env.js';
import logger from './utils/logger.js';
import app from './app.js';
import { connect, disconnect } from './config/database.js';

const PORT = env.PORT;

let server;

async function start() {
  try {
    // Connect to database before accepting traffic
    await connect();

    server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: env.NODE_ENV }, 'CertiVault API server started');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Gracefully shut down the server and database connection.
 * Allows in-flight requests to complete before closing.
 */
async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received');

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnect();
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  } else {
    await disconnect();
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

start();
