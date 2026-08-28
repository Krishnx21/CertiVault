process.env.MONGODB_URI = "mongodb://localhost/test";
process.env.JWT_SECRET = "secret";

import test from "node:test";
import assert from "node:assert/strict";
import {
  getDashboardSummary,
  invalidateDashboardCache,
} from "../../src/modules/dashboard/dashboard.controller.js";
import { cache } from "../../src/utils/cache.js";
import { Document } from "../../src/modules/documents/document.model.js";

test("Dashboard Controller", async (t) => {
  let resJson;
  const mockRes = {
    json: (data) => {
      resJson = data;
      return data;
    },
  };
  const mockNext = (err) => {
    throw err;
  };

  t.afterEach(async () => {
    // clean up mocks
    await cache.del("dashboard:summary");
    t.mock.restoreAll();
  });

  await t.test("cache miss - queries MongoDB and stores in cache", async (t) => {
    t.mock.method(Document, "countDocuments", async () => 5);
    t.mock.method(Document, "aggregate", async () => [{ total: 1024 }]);

    // ensure cache is empty
    await cache.del("dashboard:summary");

    await getDashboardSummary({}, mockRes, mockNext);

    assert.deepEqual(resJson, {
      data: {
        total: 5,
        verified: 5,
        pending: 5,
        storageBytes: 1024,
      },
    });

    const cached = await cache.get("dashboard:summary");
    assert.ok(cached);
    assert.equal(cached.storageBytes, 1024);
  });

  await t.test("cache hit - returns cached data without querying MongoDB", async (t) => {
    // store in cache first
    await cache.set("dashboard:summary", {
      total: 10,
      verified: 2,
      pending: 8,
      storageBytes: 2048,
    });

    // If Document methods are called, the test will fail if we throw
    t.mock.method(Document, "countDocuments", () => {
      throw new Error("Should not be called");
    });

    await getDashboardSummary({}, mockRes, mockNext);

    assert.deepEqual(resJson, {
      data: {
        total: 10,
        verified: 2,
        pending: 8,
        storageBytes: 2048,
      },
    });
  });

  await t.test("invalidateDashboardCache - removes cache entry", async (t) => {
    await cache.set("dashboard:summary", { total: 1 });
    await invalidateDashboardCache();
    const cached = await cache.get("dashboard:summary");
    assert.equal(cached, null);
  });
});
