import { describe, it, before } from "node:test";
import assert from "node:assert";
import { LRUCache } from "../../src/utils/cache.js";

describe("LRUCache", () => {
  it("should set and get a value", () => {
    const cache = new LRUCache<string>(3, 1000);
    cache.set("key1", "value1");
    assert.strictEqual(cache.get("key1"), "value1");
  });

  it("should return undefined for a cache miss", () => {
    const cache = new LRUCache<string>(3, 1000);
    assert.strictEqual(cache.get("nonexistent"), undefined);
  });

  it("should expire entries after TTL", async () => {
    const cache = new LRUCache<string>(3, 100);
    cache.set("temp", "data");
    assert.strictEqual(cache.get("temp"), "data");

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.strictEqual(cache.get("temp"), undefined);
  });

  it("should evict least recently used entry when capacity is reached", () => {
    const cache = new LRUCache<string>(3, 10000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    // Access "a" to make it most recently used
    cache.get("a");

    // Add "d" — should evict "b" (least recently used)
    cache.set("d", "4");

    assert.strictEqual(cache.get("a"), "1");
    assert.strictEqual(cache.get("b"), undefined);
    assert.strictEqual(cache.get("c"), "3");
    assert.strictEqual(cache.get("d"), "4");
  });

  it("should invalidate a specific key", () => {
    const cache = new LRUCache<string>(5, 10000);
    cache.set("item", "123");
    assert.strictEqual(cache.get("item"), "123");

    cache.invalidate("item");
    assert.strictEqual(cache.get("item"), undefined);
  });

  it("should clear all entries", () => {
    const cache = new LRUCache<string>(5, 10000);
    cache.set("x", "1");
    cache.set("y", "2");
    cache.clear();
    assert.strictEqual(cache.get("x"), undefined);
    assert.strictEqual(cache.get("y"), undefined);
    assert.strictEqual(cache.size, 0);
  });

  it("should update an existing key without exceeding capacity", () => {
    const cache = new LRUCache<string>(3, 10000);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    cache.set("a", "updated");
    assert.strictEqual(cache.size, 3);
    assert.strictEqual(cache.get("a"), "updated");
  });
});

