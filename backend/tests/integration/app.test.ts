import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../../src/app.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "../../src/config/db.js";
import http from "http";

let baseUrl: string;
let server: http.Server;
let mongoServer: MongoMemoryServer;

before(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect Mongoose to it
  await connectDB(mongoUri);

  // Start Express App
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (address && typeof address === "object") {
    baseUrl = `http://127.0.0.1:${address.port}`;
  } else {
    throw new Error("Failed to get server port");
  }
});

after(async () => {
  // Close Express Server
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  // Disconnect Database
  await disconnectDB();

  // Stop in-memory MongoDB
  await mongoServer.stop();
});

test("GET /health/live reports process liveness", async () => {
  const response = await fetch(`${baseUrl}/health/live`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.match(response.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/);
});

test("GET /health/ready reports readiness", async () => {
  const response = await fetch(`${baseUrl}/health/ready`, {
    headers: { "X-Request-Id": "test-request-id" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "test-request-id");
  assert.deepEqual(await response.json(), { status: "ready", checks: {} });
});

test("unknown routes return a normalized error", async () => {
  const response = await fetch(`${baseUrl}/missing`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "ROUTE_NOT_FOUND");
  assert.equal(body.error.message, "Route GET /missing was not found");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
});
