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
const bullmqOptions: Partial<RedisOptions> = {
  lazyConnect: false,
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

const REDIS_CLI_PREFIX = /^redis-cli\s+.*-u\s+(rediss?:\/\/\S+)/i;

function extractRedisUrl(raw: string): string {
  const match = REDIS_CLI_PREFIX.exec(raw);
  if (match) {
    log.warn(
      'Redis: REDIS_URL looks like a redis-cli command — extracting the URL portion automatically. ' +
      'Please update the Render env var to contain only the URL (e.g. rediss://default:PASSWORD@host:PORT).'
    );
    return match[1];
  }
  return raw;
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

function resolveRedisConfig(): { url: string } | { hostPort: Partial<RedisOptions> } | null {
  const env = getEnv();

  if (env.REDIS_URL) {
    const url = validateRedisUrl(env.REDIS_URL);
    if (url) return { url };
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

// ─── Client factories ─────────────────────────────────────────────────────────

function createRedisClient(): Redis | null {
  const config = resolveRedisConfig();
  if (!config) {
    log.warn("Redis: no REDIS_URL or REDIS_HOST configured — Redis is disabled");
    return null;
  }

  const client: Redis =
    "url" in config
      ? new Redis(config.url, sharedOptions)
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

// ─── BullMQ connection factory ────────────────────────────────────────────────
// BullMQ requires maxRetriesPerRequest: null. Returns null when Redis is not
// configured so callers can skip queue initialisation gracefully.

export function createBullMQConnection(): Redis | null {
  const config = resolveRedisConfig();
  if (!config) return null;

  const client: Redis =
    "url" in config
      ? new Redis(config.url, bullmqOptions)
      : new Redis({ ...config.hostPort, ...bullmqOptions });

  client.on("error", (err: Error) =>
    log.error("Redis (BullMQ): client error", { error: err.message })
  );

  return client;
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
  if (!redis) return;
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
