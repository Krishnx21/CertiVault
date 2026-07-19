/**
 * Redis Client Configuration
 * Single ioredis instance shared across the application.
 * Handles connection retry with exponential backoff, structured logging,
 * and graceful shutdown on SIGTERM/SIGINT.
 *
 * When neither REDIS_URL nor REDIS_HOST is configured the exported `redis`
 * value is `null` and `createBullMQConnection()` returns `null`.  All callers
 * must handle the null case gracefully.
 */

import { Redis, type RedisOptions } from "ioredis";
import { getEnv } from "./env.js";
import { createModuleLogger } from "../common/utils/logger.js";

const log = createModuleLogger("redis");

// ─── Retry strategies ────────────────────────────────────────────────────────

/** Shared client: exponential backoff, give up after 10 attempts */
function retryStrategy(times: number): number | null {
  if (times > 10) {
    log.error("Redis: max reconnection attempts (10) reached — giving up");
    return null;
  }
  const delay = Math.min(100 * 2 ** times, 2000);
  log.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
  return delay;
}

/** BullMQ client: same cap, separate function reference */
function bullmqRetryStrategy(times: number): number | null {
  if (times > 10) {
    log.error("Redis (BullMQ): max reconnection attempts (10) reached — giving up");
    return null;
  }
  const delay = Math.min(100 * 2 ** times, 2000);
  log.warn(`Redis (BullMQ): reconnecting in ${delay}ms (attempt ${times})`);
  return delay;
}

// Reconnect when READONLY errors happen (e.g. failover to replica)
function reconnectOnError(err: Error): boolean {
  return err.message.startsWith("READONLY");
}

// ─── Shared connection option overrides ──────────────────────────────────────

const sharedOptions: Partial<RedisOptions> = {
  lazyConnect: false,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy,
  reconnectOnError,
};

// BullMQ requires maxRetriesPerRequest: null on every connection it manages.
// lazyConnect: true means the socket is NOT opened until BullMQ first issues a
// command — this prevents a connection storm at module-import time when Redis
// is temporarily unreachable (e.g. Render cold-start before Redis is ready).
const bullmqOptions: Partial<RedisOptions> = {
  lazyConnect: true,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  retryStrategy: bullmqRetryStrategy,
  reconnectOnError,
};

// ─── URL extraction & validation ─────────────────────────────────────────────
//
// Render's Redis addon sometimes surfaces the connection info as a redis-cli
// invocation string instead of a plain URL, e.g.:
//   redis-cli --tls -u rediss://default:PASSWORD@host:6379
//
// We extract the URL portion before passing it to the URL validator so that
// a misconfigured env var doesn't silently fall through to localhost.

function extractRedisUrl(raw: string): string {
  if (typeof raw !== "string") return "";

  // Trim leading/trailing whitespace and quotes
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Extract the URL portion
  const urlMatch = /(rediss?:\/\/[^\s'"]+)/i.exec(cleaned);
  if (urlMatch) {
    const extracted = urlMatch[1];
    if (cleaned !== extracted) {
      log.warn(
        "Redis: REDIS_URL looks like a redis-cli command or has extra characters — extracting the URL portion automatically. " +
        "Please update the Render env var to contain only the URL (e.g. rediss://default:PASSWORD@host:PORT)."
      );
    }
    return extracted;
  }

  return cleaned;
}

function validateRedisUrl(raw: string): string | null {
  const candidate = extractRedisUrl(raw);
  try {
    const parsed = new URL(candidate);
    if (!["redis:", "rediss:"].includes(parsed.protocol)) {
      log.warn(
        `Redis: REDIS_URL has unexpected protocol "${parsed.protocol}" — expected redis:// or rediss://. Ignoring.`
      );
      return null;
    }
    return candidate;
  } catch {
    log.warn(
      `Redis: REDIS_URL is not a valid URL ("${raw.slice(0, 80)}...") — ignoring and falling back to host/port config.`
    );
    return null;
  }
}

// ─── Resolve the effective connection URL / options ───────────────────────────

function resolveRedisConfig(): { url: string; tls: boolean } | { hostPort: Partial<RedisOptions> } | null {
  const env = getEnv();

  if (env.REDIS_URL) {
    const url = validateRedisUrl(env.REDIS_URL);
    if (url) {
      // rediss:// means TLS — Upstash always requires this
      const tls = url.startsWith("rediss://");
      return { url, tls };
    }
    // URL was present but invalid — fall through to host/port
  }

  if (env.REDIS_HOST) {
    return {
      hostPort: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
        username: env.REDIS_USERNAME,
        password: env.REDIS_PASSWORD,
        tls: env.REDIS_TLS === "true" ? {} : undefined,
      },
    };
  }

  // No Redis configuration at all
  return null;
}

// ─── TLS options for rediss:// connections ────────────────────────────────────
// Upstash (and other TLS-only providers) use rediss:// and require an explicit
// tls object with servername set for SNI — without it ioredis gets ECONNRESET
// because the TLS handshake fails silently.

function buildTlsOptions(url: string): Partial<RedisOptions> {
  try {
    const { hostname } = new URL(url);
    return { tls: { servername: hostname } };
  } catch {
    return { tls: {} };
  }
}

// ─── Client factories ─────────────────────────────────────────────────────────

function createRedisClient(): Redis | null {
  const config = resolveRedisConfig();
  if (!config) {
    log.warn("Redis: no REDIS_URL or REDIS_HOST configured — Redis is disabled");
    return null;
  }

  const extraOpts = "url" in config && config.tls ? buildTlsOptions(config.url) : {};

  const client: Redis =
    "url" in config
      ? new Redis(config.url, { ...sharedOptions, ...extraOpts })
      : new Redis({ ...config.hostPort, ...sharedOptions });

  client.on("connect", () => log.info("Redis: TCP connection established"));
  client.on("ready",   () => log.info("Redis: client ready — commands can be sent"));
  client.on("error",   (err: Error) => log.error("Redis: client error", { error: err.message }));
  client.on("close",   () => log.warn("Redis: connection closed"));
  client.on("reconnecting", (delay: number) => log.warn(`Redis: reconnecting in ${delay}ms`));
  client.on("end",     () => log.warn("Redis: connection ended (no more retries)"));

  return client;
}

// ─── Singleton instance ───────────────────────────────────────────────────────

export const redis: Redis | null = createRedisClient();

// ─── BullMQ connection singleton ─────────────────────────────────────────────
// A single ioredis instance is shared across all BullMQ queues and workers.
// BullMQ manages its own internal connection multiplexing, so one shared
// client is sufficient and avoids the N-connection storm seen when each queue
// calls createBullMQConnection() independently at startup.
//
// lazyConnect: true means the socket is not opened until BullMQ first issues a
// command, so importing this module never triggers a connection attempt.

let _bullmqConnection: Redis | null = null;

export function createBullMQConnection(): Redis | null {
  // Return null when Redis is not configured — callers must handle gracefully.
  const config = resolveRedisConfig();
  if (!config) return null;

  // Re-use the existing connection if it is still usable.
  if (_bullmqConnection && _bullmqConnection.status !== "end") {
    return _bullmqConnection;
  }

  const extraOpts = "url" in config && config.tls ? buildTlsOptions(config.url) : {};

  const client: Redis =
    "url" in config
      ? new Redis(config.url, { ...bullmqOptions, ...extraOpts })
      : new Redis({ ...config.hostPort, ...bullmqOptions });

  client.on("error", (err: Error) =>
    log.error("Redis (BullMQ): client error", { error: err.message })
  );
  client.on("end", () =>
    log.warn("Redis (BullMQ): connection ended — will recreate on next use")
  );

  _bullmqConnection = client;
  return _bullmqConnection;
}

// ─── Health check helper ──────────────────────────────────────────────────────

export async function checkRedisHealth(): Promise<"healthy" | "unhealthy" | "disabled"> {
  if (!redis) return "disabled";
  try {
    const reply = await redis.ping();
    return reply === "PONG" ? "healthy" : "unhealthy";
  } catch {
    return "unhealthy";
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

export async function disconnectRedis(): Promise<void> {
  // Shut down the shared app client
  if (redis) {
    try {
      await redis.quit();
      log.info("Redis: disconnected gracefully");
    } catch (err) {
      log.error("Redis: error during disconnect", {
        error: err instanceof Error ? err.message : String(err),
      });
      redis.disconnect();
    }
  }

  // Shut down the shared BullMQ client
  if (_bullmqConnection && _bullmqConnection.status !== "end") {
    try {
      await _bullmqConnection.quit();
      log.info("Redis (BullMQ): disconnected gracefully");
    } catch (err) {
      log.error("Redis (BullMQ): error during disconnect", {
        error: err instanceof Error ? err.message : String(err),
      });
      _bullmqConnection.disconnect();
    } finally {
      _bullmqConnection = null;
    }
  }
}
