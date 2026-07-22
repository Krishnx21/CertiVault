import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getEnv } from "../../src/config/env.js";

const originalMongoUri = process.env.MONGODB_URI;
const originalJwtSecret = process.env.JWT_SECRET;

before(() => {
  process.env.MONGODB_URI = "mongodb://localhost:27017/test";
  process.env.JWT_SECRET = "supersecretkey";
});

after(() => {
  if (originalMongoUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originalMongoUri;
  }

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

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

test("env: NODE_ENV defaults to 'development' when unset", () => {
  const originalEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;
  try {
    const env = getEnv();
    assert.equal(env.nodeEnv, "development");
  } finally {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    }
  }
});

test("env: NODE_ENV reflects the value set in the environment", () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.equal(getEnv().nodeEnv, "production");

    process.env.NODE_ENV = "test";
    assert.equal(getEnv().nodeEnv, "test");
  } finally {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  }
});

test("env: FRONTEND_ORIGIN defaults to localhost when unset", () => {
  const originalEnv = process.env.FRONTEND_ORIGIN;
  delete process.env.FRONTEND_ORIGIN;
  try {
    const env = getEnv();
    assert.equal(env.frontendOrigin, "http://localhost:5173");
  } finally {
    if (originalEnv !== undefined) {
      process.env.FRONTEND_ORIGIN = originalEnv;
    }
  }
});

test("env: FRONTEND_ORIGIN reflects the value set in the environment", () => {
  const originalEnv = process.env.FRONTEND_ORIGIN;
  try {
    process.env.FRONTEND_ORIGIN = "https://app.certivault.io";
    assert.equal(getEnv().frontendOrigin, "https://app.certivault.io");
  } finally {
    if (originalEnv !== undefined) {
      process.env.FRONTEND_ORIGIN = originalEnv;
    } else {
      delete process.env.FRONTEND_ORIGIN;
    }
  }
});

test("env: FRONTEND_ORIGIN parses comma-separated multiple origins into an array", () => {
  const originalEnv = process.env.FRONTEND_ORIGIN;
  try {
    process.env.FRONTEND_ORIGIN = "http://localhost:5173, http://localhost:3000, https://app.certivault.io";
    assert.deepEqual(getEnv().frontendOrigin, [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://app.certivault.io",
    ]);
  } finally {
    if (originalEnv !== undefined) {
      process.env.FRONTEND_ORIGIN = originalEnv;
    } else {
      delete process.env.FRONTEND_ORIGIN;
    }
  }
});
