import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";

const SECRET = "test-secret";
const USER_A = "user-a-id";
const USER_B = "user-b-id";
const FAKE_ID = "64b1f1f1f1f1f1f1f1f1f1f1";

const tokenFor = (userId) => jwt.sign({ id: userId }, SECRET);

process.env.JWT_SECRET = SECRET;
process.env.MONGODB_URI = "mongodb://localhost/test"; // prevent env error; DB won't be used

// ── In-memory document store ──────────────────────────────────────────────────
const FAKE_DOC = {
  _id: FAKE_ID,
  name: "test.pdf",
  type: "Certificate",
  mimeType: "application/pdf",
  size: 1024,
  checksum: "abc123",
  owner: USER_A,
  status: "pending",
  tags: [],
  createdAt: new Date().toISOString(),
  verifiedAt: null,
  s3Key: "documents/test.pdf",
  s3Bucket: "test-bucket",
};

// Patch Document model before importing app
const docModule = await import("../../src/modules/documents/document.model.js");
const Doc = docModule.Document;

const lean = (val) => ({ lean: () => Promise.resolve(val) });

Doc.find = () => ({
  sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve([FAKE_DOC]) }) }) }),
});
Doc.countDocuments = () => Promise.resolve(1);
Doc.findById = (id) => lean(String(id) === FAKE_ID ? FAKE_DOC : null);
Doc.create = (data) => Promise.resolve({ ...FAKE_DOC, ...data });
Doc.findByIdAndUpdate = (_id, updates) =>
  lean(String(_id) === FAKE_ID ? { ...FAKE_DOC, ...updates } : null);
Doc.findByIdAndDelete = () => Promise.resolve(null);

// Inject fake storage into controller
const ctrlModule = await import("../../src/modules/documents/document.controller.js");
ctrlModule._setStorage({
  uploadToS3: async () => ({ bucket: "test-bucket" }),
  deleteFromS3: async () => {},
  getPresignedUrl: async () => "https://s3.example.com/presigned",
});

const { createApp } = await import("../../src/app.js");

let baseUrl;
let server;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

// ── Auth ──────────────────────────────────────────────────────────────────────

test("GET /api/documents: 401 when no token", async () => {
  const res = await fetch(`${baseUrl}/api/documents`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("GET /api/documents: 401 when token is invalid", async () => {
  const res = await fetch(`${baseUrl}/api/documents`, {
    headers: { Authorization: "Bearer bad.token.here" },
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "UNAUTHORIZED");
});

// ── List ──────────────────────────────────────────────────────────────────────

test("GET /api/documents: 200 with valid token", async () => {
  const res = await fetch(`${baseUrl}/api/documents`, {
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data));
  assert.equal(typeof body.total, "number");
});

// ── Get by ID ─────────────────────────────────────────────────────────────────

test("GET /api/documents/:id: 404 for unknown id", async () => {
  const res = await fetch(`${baseUrl}/api/documents/000000000000000000000001`, {
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
});

test("GET /api/documents/:id: 200 with presigned URL for known id", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${FAKE_ID}`, {
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.id, FAKE_ID);
  assert.equal(typeof body.data.downloadUrl, "string");
});

// ── Upload ────────────────────────────────────────────────────────────────────

test("POST /api/documents: 400 when no file attached", async () => {
  const res = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "FILE_REQUIRED");
});

test("POST /api/documents: 415 for disallowed MIME type", async () => {
  const form = new FormData();
  form.append("file", new Blob(["data"], { type: "text/plain" }), "test.txt");
  const res = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
    body: form,
  });
  assert.equal(res.status, 415);
  const body = await res.json();
  assert.equal(body.error.code, "UNSUPPORTED_FILE_TYPE");
});

// ── Update ────────────────────────────────────────────────────────────────────

test("PUT /api/documents/:id: 404 for unknown id", async () => {
  const res = await fetch(`${baseUrl}/api/documents/000000000000000000000001`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_A)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "new name" }),
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
});

test("PUT /api/documents/:id: 403 when requester is not owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${FAKE_ID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_B)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "new name" }),
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "FORBIDDEN");
});

// ── Delete ────────────────────────────────────────────────────────────────────

test("DELETE /api/documents/:id: 404 for unknown id", async () => {
  const res = await fetch(`${baseUrl}/api/documents/000000000000000000000001`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
});

test("DELETE /api/documents/:id: 403 when requester is not owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${FAKE_ID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenFor(USER_B)}` },
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "FORBIDDEN");
});

// ── Verify ────────────────────────────────────────────────────────────────────

test("PATCH /api/documents/:id/verify: 404 for unknown id", async () => {
  const res = await fetch(`${baseUrl}/api/documents/000000000000000000000001/verify`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
});
