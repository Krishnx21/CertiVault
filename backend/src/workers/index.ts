/**
 * Workers Entry Point
 * Standalone script — run with:  node dist/workers/index.js
 *
 * Boots MongoDB + Redis then starts all BullMQ workers.
 * Handles graceful shutdown on SIGTERM / SIGINT.
 */

import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import type { Worker } from "bullmq";
import { connectDB, disconnectDB } from "../config/db.js";
import { redis, disconnectRedis } from "../config/redis.js";
import { getEnv } from "../config/env.js";
import { createModuleLogger } from "../common/utils/logger.js";
import { startEmailWorker } from "./email.worker.js";
import { startNotificationWorker } from "./notification.worker.js";

const log = createModuleLogger("workers");

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  const env = getEnv();

  log.info("Workers: starting up...");

  // Connect to MongoDB (notifications worker writes to DB)
  await connectDB(env.MONGODB_URI);

  const r = redis;
  if (!r) {
    log.warn("Workers: Redis is not configured — no workers will be started");
    return;
  }

  await new Promise<void>((resolve, reject) => {
    if (r.status === "ready") {
      resolve();
      return;
    }
    r.once("ready", resolve);
    r.once("error", reject);
    // Timeout after 15 s
    setTimeout(() => reject(new Error("Redis did not become ready within 15 s")), 15_000);
  });

  log.info("Workers: Redis ready");

  // ── Spawn workers ────────────────────────────────────────────────────────
  const workers: Worker[] = [
    startEmailWorker(),
    startNotificationWorker(),
  ];

  log.info(`Workers: ${workers.length} workers running`);

  // ── Graceful shutdown ────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    log.info(`Workers: received ${signal} — shutting down gracefully`);

    try {
      // Close all workers (wait for active jobs to finish, up to 30 s each)
      await Promise.all(
        workers.map((w) =>
          w.close().catch((err: Error) =>
            log.error("Error closing worker", { error: err.message })
          )
        )
      );
      log.info("Workers: all workers closed");

      await disconnectDB();
      await disconnectRedis();

      log.info("Workers: shutdown complete");
      process.exit(0);
    } catch (err) {
      log.error("Workers: error during shutdown", {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    }
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  // Surface uncaught errors — worker process should not silently die
  process.on("uncaughtException", (err: Error) => {
    log.error("Workers: uncaught exception", {
      error: err.message,
      stack: err.stack,
    });
    // Do NOT exit — let the worker attempt to recover
  });

  process.on("unhandledRejection", (reason: unknown) => {
    log.error("Workers: unhandled promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

start().catch((err: Error) => {
  console.error("Workers: fatal startup error", err);
  process.exit(1);
});
