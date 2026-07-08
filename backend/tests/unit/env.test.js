import assert from "node:assert/strict";
import { test } from "node:test";
import { getEnv } from "../../src/config/env.js";

test("env: default port when API_PORT is missing", () => {
  const originalEnv = process.env.API_PORT;
  delete process.env.API_PORT;
  try {
    const env = getEnv();
    assert.equal(env.port, 5000);
  } finally {
    if (originalEnv !== undefined) {
      process.env.API_PORT = originalEnv;
    }
  }
});

test("env: accept valid ports", () => {
  const originalEnv = process.env.API_PORT;
  try {
    process.env.API_PORT = "8080";
    assert.equal(getEnv().port, 8080);

    process.env.API_PORT = "1";
    assert.equal(getEnv().port, 1);

    process.env.API_PORT = "65535";
    assert.equal(getEnv().port, 65535);
  } finally {
    if (originalEnv !== undefined) {
      process.env.API_PORT = originalEnv;
    }
  }
});

test("env: reject invalid ports", () => {
  const originalEnv = process.env.API_PORT;
  const invalidPorts = ["0", "-1", "65536", "3000.5", "abc", "", "   "];

  try {
    for (const port of invalidPorts) {
      process.env.API_PORT = port;
      assert.throws(() => getEnv(), /API_PORT must be an integer between 1 and 65535/);
    }
  } finally {
    if (originalEnv !== undefined) {
      process.env.API_PORT = originalEnv;
    }
  }
});
