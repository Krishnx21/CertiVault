process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { test } from "node:test";

test("env: default port when PORT is missing", async () => {
  const originalEnv = process.env.PORT;
  delete process.env.PORT;
  try {
    const { getEnv } = await import(`../../src/config/env.js?t=1`);
    const env = getEnv();
    assert.equal(env.PORT, 5000);
  } finally {
    if (originalEnv !== undefined) {
      process.env.PORT = originalEnv;
    }
  }
});

test("env: accept valid ports", async () => {
  const originalEnv = process.env.PORT;
  try {
    process.env.PORT = "8080";
    const { getEnv: getEnv1 } = await import(`../../src/config/env.js?t=2`);
    assert.equal(getEnv1().PORT, 8080);

    process.env.PORT = "1";
    const { getEnv: getEnv2 } = await import(`../../src/config/env.js?t=3`);
    assert.equal(getEnv2().PORT, 1);

    process.env.PORT = "65535";
    const { getEnv: getEnv3 } = await import(`../../src/config/env.js?t=4`);
    assert.equal(getEnv3().PORT, 65535);
  } finally {
    if (originalEnv !== undefined) {
      process.env.PORT = originalEnv;
    } else {
      delete process.env.PORT;
    }
  }
});

test("env: reject invalid ports", async () => {
  const originalEnv = process.env.PORT;
  const invalidPorts = ["0", "-1", "65536", "3000.5", "abc", "", "   "];

  try {
    let t = 5;
    for (const port of invalidPorts) {
      process.env.PORT = port;
      await assert.rejects(async () => {
        const { getEnv } = await import(`../../src/config/env.js?t=${t++}`);
        // validation happens when getEnv is executed
        getEnv();
      });
    }
  } finally {
    if (originalEnv !== undefined) {
      process.env.PORT = originalEnv;
    }
  }
});

// CORS parsing tests for FRONTEND_ORIGIN
test("env: FRONTEND_ORIGIN defaults to localhost when unset", async () => {
  const original = process.env.FRONTEND_ORIGIN;
  delete process.env.FRONTEND_ORIGIN;
  try {
    delete process.env.PORT;
    const { getEnv } = await import(`../../src/config/env.js?t=10`);
    const env = getEnv();
    assert.equal(env.FRONTEND_ORIGIN, "http://localhost:5173");
  } finally {
    if (original !== undefined) process.env.FRONTEND_ORIGIN = original;
  }
});

test("env: parses single FRONTEND_ORIGIN", async () => {
  const original = process.env.FRONTEND_ORIGIN;
  process.env.FRONTEND_ORIGIN = "http://example.com";
  try {
    delete process.env.PORT;
    const { getEnv } = await import(`../../src/config/env.js?t=11`);
    const env = getEnv();
    assert.equal(env.FRONTEND_ORIGIN, "http://example.com");
  } finally {
    if (original !== undefined) process.env.FRONTEND_ORIGIN = original;
    else delete process.env.FRONTEND_ORIGIN;
  }
});

test("env: parses multiple comma-separated FRONTEND_ORIGIN values", async () => {
  const original = process.env.FRONTEND_ORIGIN;
  process.env.FRONTEND_ORIGIN = "http://a.com, http://b.com";
  try {
    delete process.env.PORT;
    const { getEnv } = await import(`../../src/config/env.js?t=12`);
    const env = getEnv();
    assert.deepEqual(env.FRONTEND_ORIGIN, ["http://a.com", "http://b.com"]);
  } finally {
    if (original !== undefined) process.env.FRONTEND_ORIGIN = original;
    else delete process.env.FRONTEND_ORIGIN;
  }
});

test("env: supports wildcard FRONTEND_ORIGIN '*'", async () => {
  const original = process.env.FRONTEND_ORIGIN;
  process.env.FRONTEND_ORIGIN = "*";
  try {
    delete process.env.PORT;
    const { getEnv } = await import(`../../src/config/env.js?t=13`);
    const env = getEnv();
    assert.equal(env.FRONTEND_ORIGIN, "*");
  } finally {
    if (original !== undefined) process.env.FRONTEND_ORIGIN = original;
    else delete process.env.FRONTEND_ORIGIN;
  }
});
