interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export interface ICache<T = unknown> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  invalidate(key: string): void;
}

export class LRUCache<T = unknown> implements ICache<T> {
  private maxSize: number;
  private defaultTtl: number;
  private cache: Map<string, CacheEntry<T>>;

  constructor(maxSize = 500, defaultTtl = 300_000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    this.cache = new Map();
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttl: number = this.defaultTtl): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const presignedUrlCache = new LRUCache<string>();

