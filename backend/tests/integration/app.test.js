import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../../src/app.js";

let baseUrl;
let server;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /health/live reports process liveness", async () => {
  const response = await fetch(`${baseUrl}/health/live`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
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
