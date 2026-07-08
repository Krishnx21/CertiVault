import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../../src/app.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "../../src/config/db.js";
import { DocumentModel } from "../../src/modules/documents/document.model.js";
import type { IDocument } from "../../src/modules/documents/document.model.js";
import http from "http";

let baseUrl: string;
let server: http.Server;
let mongoServer: MongoMemoryServer;

// Seed data matching the expected initial documents in the store
const now = Date.now();

const seedDocuments: IDocument[] = [
  {
    id: "demo-credential",
    name: "Cloud Security Certificate.pdf",
    type: "Certificate",
    size: 2457600,
    status: "verified",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 2 * 86400000).toISOString(),
    checksum: "7b9f4c2e8a10d34f",
  },
  {
    id: "demo-contract",
    name: "Vendor Agreement 2026.pdf",
    type: "Contract",
    size: 1153433,
    status: "pending",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 5 * 86400000).toISOString(),
    checksum: "a41d9b6604cc82e1",
  },
  {
    id: "demo-identity",
    name: "Identity Verification.png",
    type: "Identity",
    size: 845414,
    status: "verified",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 8 * 86400000).toISOString(),
    checksum: "18e613fea60aeb4d",
  },
];

before(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect Mongoose to it
  await connectDB(mongoUri);

  // Seed initial documents
  await DocumentModel.deleteMany({});
  await DocumentModel.insertMany(seedDocuments);

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
  const body: any = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(typeof body.version, "string");
  assert.ok(body.version.length > 0);
  assert.equal(typeof body.uptimeSeconds, "number");
  assert.ok(body.uptimeSeconds >= 0);
  assert.match(response.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/);
  assert.match(response.headers.get("x-response-time") || "", /^\d+(\.\d+)?ms$/);
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

// ─── Document & Dashboard Integration Tests ───────────────────────────────────────

test("GET /api/documents returns all documents", async () => {
  const response = await fetch(`${baseUrl}/api/documents`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.equal(body.total, 3);
  assert.equal(body.data.length, 3);
  assert.equal(body.data[0].id, "demo-credential");
});

test("GET /api/documents?search=cloud filters by search text", async () => {
  const response = await fetch(`${baseUrl}/api/documents?search=cloud`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.total, 1);
  assert.equal(body.data[0].id, "demo-credential");
});

test("GET /api/documents?status=pending filters by status", async () => {
  const response = await fetch(`${baseUrl}/api/documents?status=pending`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.total, 1);
  assert.equal(body.data[0].id, "demo-contract");
  assert.equal(body.data[0].status, "pending");
});

test("GET /api/documents?search=nonexistent returns empty list", async () => {
  const response = await fetch(`${baseUrl}/api/documents?search=nonexistent`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.total, 0);
  assert.deepEqual(body.data, []);
});

test("POST /api/documents returns 400 when no file is attached", async () => {
  const response = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, "FILE_REQUIRED");
  assert.equal(body.error.message, "Select a file to upload");
});

test("POST /api/documents uploads a file and returns 201", async () => {
  const fileContent = new Blob(["dummy pdf content"], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", fileContent, "test-document.pdf");
  formData.append("type", "Certificate");

  const response = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
    body: formData,
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.ok(body.data);
  assert.equal(body.data.name, "test-document.pdf");
  assert.equal(body.data.type, "Certificate");
  assert.equal(body.data.status, "pending");
  assert.equal(typeof body.data.id, "string");
  assert.ok(body.data.id.length > 0);
  assert.equal(typeof body.data.checksum, "string");
  assert.ok(body.data.checksum.length > 0);
  assert.match(response.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/);
  assert.match(response.headers.get("x-response-time") || "", /^\d+(\.\d+)?ms$/);
});

test("PATCH /api/documents/:id/verify verifies a pending document", async () => {
  const response = await fetch(`${baseUrl}/api/documents/demo-contract/verify`, {
    method: "PATCH",
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.status, "verified");
  assert.equal(typeof body.data.verifiedAt, "string");
  assert.ok(body.data.verifiedAt.length > 0);
});

test("PATCH /api/documents/:id/verify returns 404 for unknown document", async () => {
  const response = await fetch(`${baseUrl}/api/documents/unknown-id/verify`, {
    method: "PATCH",
  });

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
  assert.equal(body.error.message, "Document was not found");
});

test("DELETE /api/documents/:id deletes an existing document", async () => {
  const response = await fetch(`${baseUrl}/api/documents/demo-identity`, {
    method: "DELETE",
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("content-type"), null);

  // Confirm it's gone — the upload test added 1 doc, so we go from 4 → 3
  const listResponse = await fetch(`${baseUrl}/api/documents`);
  const listBody = await listResponse.json();
  assert.equal(listBody.total, 3);
  assert.equal(
    listBody.data.find((d: any) => d.id === "demo-identity"),
    undefined
  );
});

test("DELETE /api/documents/:id returns 404 for unknown document", async () => {
  const response = await fetch(`${baseUrl}/api/documents/unknown-id`, {
    method: "DELETE",
  });

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
  assert.equal(body.error.message, "Document was not found");
});

test("GET /api/dashboard/summary returns workspace metrics", async () => {
  // After delete test: 3 remaining (demo-credential, demo-contract, uploaded doc)
  // demo-credential: verified | demo-contract: verified (verify test) | uploaded: pending
  const response = await fetch(`${baseUrl}/api/dashboard/summary`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.data);
  assert.equal(typeof body.data.total, "number");
  assert.equal(typeof body.data.verified, "number");
  assert.equal(typeof body.data.pending, "number");
  assert.equal(typeof body.data.storageBytes, "number");
  assert.equal(body.data.total, 3);
  assert.equal(body.data.verified, 2);
  assert.equal(body.data.pending, 1);
  assert.ok(body.data.storageBytes > 2457600 + 1153433);
  assert.match(response.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/);
  assert.match(response.headers.get("x-response-time") || "", /^\d+(\.\d+)?ms$/);
});
