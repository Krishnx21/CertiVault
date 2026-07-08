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
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(typeof body.version, "string");
  assert.ok(body.version.length > 0);
  assert.equal(typeof body.uptimeSeconds, "number");
  assert.ok(body.uptimeSeconds >= 0);
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
  assert.match(response.headers.get("x-response-time"), /^\d+(\.\d+)?ms$/);
});

test("GET /health/ready reports readiness", async () => {
  const response = await fetch(`${baseUrl}/health/ready`, {
    headers: { "X-Request-Id": "test-request-id" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "test-request-id");
  assert.match(response.headers.get("x-response-time"), /^\d+(\.\d+)?ms$/);
  const body = await response.json();
  assert.equal(body.status, "ready");
  assert.equal(typeof body.version, "string");
  assert.ok(body.version.length > 0);
  assert.deepEqual(body.checks, {});
});

test("unknown routes return a normalized error", async () => {
  const response = await fetch(`${baseUrl}/missing`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "ROUTE_NOT_FOUND");
  assert.equal(body.error.message, "Route GET /missing was not found");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
  assert.match(response.headers.get("x-response-time"), /^\d+(\.\d+)?ms$/);
});

test("GET /api returns root API info", async () => {
  const response = await fetch(`${baseUrl}/api`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.service, "CertiVault API");
  assert.equal(body.status, "running");
  assert.equal(body.links.liveness, "/health/live");
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
});

test("Request-ID: preserves client-provided X-Request-Id header", async () => {
  const customId = "my-custom-request-id-123";
  const response = await fetch(`${baseUrl}/health/live`, {
    headers: { "X-Request-Id": customId },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), customId);
});

test("Request-ID: generates a valid UUID X-Request-Id when missing", async () => {
  const response = await fetch(`${baseUrl}/health/live`);

  assert.equal(response.status, 200);
  const requestId = response.headers.get("x-request-id");
  assert.match(requestId, /^[0-9a-f-]{36}$/);
});

test("Request-ID: echoes client-provided request ID in error response body", async () => {
  const customId = "error-custom-request-id";
  const response = await fetch(`${baseUrl}/missing`, {
    headers: { "X-Request-Id": customId },
  });

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.requestId, customId);
  assert.equal(response.headers.get("x-request-id"), customId);
});

test("returns HTTP 400 with normalized error when JSON is malformed", async () => {
  const response = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "json-error-id",
    },
    body: "{ malformed json }",
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, "BAD_REQUEST");
  assert.equal(body.error.message, "Malformed JSON payload");
  assert.equal(body.requestId, "json-error-id");
  assert.equal(body.error.stack, undefined);
});
