import { Redis } from "ioredis";
import { getEnv } from "./env.js";

let _sharedRedis = null;
let _bullmqConnection = null;

const getRedisOptions = () => {
  const env = getEnv();
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl) {
    return { url: redisUrl };
  }

  if (redisHost) {
    return {
      options: {
        host: redisHost,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      },
    };
  }

  return null;
};

export const createBullMQConnection = () => {
  const config = getRedisOptions();
  if (!config) return null;

  if (_bullmqConnection && _bullmqConnection.status !== "end") {
    return _bullmqConnection;
  }

  try {
    const opts = {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    const client = config.url
      ? new Redis(config.url, opts)
      : new Redis({ ...config.options, ...opts });

    client.on("error", (err) => {
      // Prevent uncaught errors when Redis is not available
      if (process.env.NODE_ENV !== "test") {
        console.warn("Redis (BullMQ) error:", err.message);
      }
    });

    _bullmqConnection = client;
    return _bullmqConnection;
  } catch (err) {
    return null;
  }
};

export const getRedisClient = () => {
  const config = getRedisOptions();
  if (!config) return null;

  if (_sharedRedis && _sharedRedis.status !== "end") {
    return _sharedRedis;
  }

  try {
    const opts = {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    };

    const client = config.url
      ? new Redis(config.url, opts)
      : new Redis({ ...config.options, ...opts });

    client.on("error", (err) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn("Redis client error:", err.message);
      }
    });

    _sharedRedis = client;
    return _sharedRedis;
  } catch (err) {
    return null;
  }
};

export const disconnectRedis = async () => {
  if (_sharedRedis) {
    try {
      await _sharedRedis.quit();
    } catch {
      _sharedRedis.disconnect();
    }
    _sharedRedis = null;
  }

  if (_bullmqConnection) {
    try {
      await _bullmqConnection.quit();
    } catch {
      _bullmqConnection.disconnect();
    }
    _bullmqConnection = null;
  }
};
