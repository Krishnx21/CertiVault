import NodeCache from "node-cache";
import { getRedisClient } from "../config/redis.js";

const memCache = new NodeCache();

class CacheService {
  /**
   * Get a value from the cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const val = await redis.get(key);
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
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), "EX", ttl);
      } catch (err) {
        console.error("Redis set error:", err);
        memCache.set(key, value, ttl);
      }
      return;
    }
    memCache.set(key, value, ttl);
  }

  /**
   * Delete a value from the cache
   * @param {string} key
   */
  async del(key) {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(key);
      } catch (err) {
        console.error("Redis del error:", err);
        memCache.del(key);
      }
      return;
    }
    memCache.del(key);
  }
}

export const cache = new CacheService();
