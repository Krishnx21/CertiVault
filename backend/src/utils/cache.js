import NodeCache from "node-cache";
import { redis as redisClient } from "../config/redis.js";

const memCache = new NodeCache();

class CacheService {
  /**
   * Get a value from the cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.error("Redis get error:", err);
        return memCache.get(key) || null;
      }
    }
    return memCache.get(key) || null;
  }

  /**
   * Set a value in the cache with a TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} ttl
   */
  async set(key, value, ttl = 300) {
    if (redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), "EX", ttl);
        return;
      } catch (err) {
        console.error("Redis set error:", err);
        memCache.set(key, value, ttl);
        return;
      }
    }
    memCache.set(key, value, ttl);
  }

  /**
   * Delete a value from the cache
   * @param {string} key
   */
  async del(key) {
    if (redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        console.error("Redis del error:", err);
        memCache.del(key);
        return;
      }
    }
    memCache.del(key);
  }
}

export const cache = new CacheService();
