import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";

const SECRET = "test-secret";
const USER_A = "user-a-id";
const USER_B = "user-b-id";
const DOC_ID = "64b1f1f1f1f1f1f1f1f1f1f1";
const LINK_ID = "64b2f2f2f2f2f2f2f2f2f2f2";
const FUTURE = new Date(Date.now() + 86400000).toISOString();
const PAST = new Date(Date.now() - 86400000).toISOString();

const tokenFor = (userId) => jwt.sign({ id: userId }, SECRET, { expiresIn: "1d" });

process.env.JWT_SECRET = SECRET;
process.env.MONGODB_URI = "mongodb://localhost/test";

const FAKE_DOC = {
  _id: DOC_ID,
  name: "test.pdf",
  type: "Certificate",
  mimeType: "application/pdf",
  size: 1024,
  checksum: "abc123",
  owner: USER_A,
  status: "pending",
  s3Key: "documents/test.pdf",
  s3Bucket: "test-bucket",
  createdAt: new Date().toISOString(),
};

const FAKE_LINK = {
  _id: LINK_ID,
  documentId: DOC_ID,
  owner: USER_A,
  tokenHash: "hashedtoken",
  expiresAt: new Date(Date.now() + 86400000),
  revokedAt: null,
  accessLog: [],
  createdAt: new Date().toISOString(),
};

// Inject fake storage and models into share controller
const shareCtrl = await import("../../src/modules/share/share.controller.js");
shareCtrl._setStorage({ getPresignedUrl: async () => "https://s3.example.com/presigned" });

const lean = (val) => ({ lean: () => Promise.resolve(val) });

const fakeDoc = {
  findById: (id) => {
    const match = String(id) === DOC_ID;
    return lean(match ? FAKE_DOC : null);
  },
};

const fakeSL = {
  create: async (data) => ({ ...FAKE_LINK, ...data, accessLog: [] }),
  find: () => ({ lean: () => Promise.resolve([FAKE_LINK]) }),
  findOne: async () => FAKE_LINK,
  findOneAndUpdate: (_q, _u) => lean(FAKE_LINK),
  updateOne: async () => ({}),
};

shareCtrl._setModels(fakeDoc, fakeSL);
console.log("DocModel after set:", shareCtrl._getModels().DocModel === fakeDoc);

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

// ── Create share link ─────────────────────────────────────────────────────────

test("POST /api/documents/:id/share-links: 401 without token", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresAt: FUTURE }),
  });
  assert.equal(res.status, 401);
});

test("POST /api/documents/:id/share-links: 403 when not owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_B)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresAt: FUTURE }),
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "FORBIDDEN");
});

test("POST /api/documents/:id/share-links: 400 when expiresAt is missing", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_A)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "INVALID_EXPIRY");
});

test("POST /api/documents/:id/share-links: 400 when expiresAt is in the past", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_A)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresAt: PAST }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "INVALID_EXPIRY");
});

test("POST /api/documents/:id/share-links: 201 with raw token for owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_A)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresAt: FUTURE }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(typeof body.data.token, "string");
  assert.ok(body.data.token.length > 0);
  assert.equal(body.data.token.length, 64); // 32 bytes hex
});

test("POST /api/documents/:id/share-links: 404 for unknown document", async () => {
  const res = await fetch(`${baseUrl}/api/documents/000000000000000000000001/share-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(USER_A)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresAt: FUTURE }),
  });
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "DOCUMENT_NOT_FOUND");
});

// ── List share links ──────────────────────────────────────────────────────────

test("GET /api/documents/:id/share-links: 403 when not owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    headers: { Authorization: `Bearer ${tokenFor(USER_B)}` },
  });
  assert.equal(res.status, 403);
});

test("GET /api/documents/:id/share-links: 200 returns list for owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links`, {
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data));
});

// ── Revoke share link ─────────────────────────────────────────────────────────

test("DELETE /api/documents/:id/share-links/:linkId: 403 when not owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links/${LINK_ID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenFor(USER_B)}` },
  });
  assert.equal(res.status, 403);
});

test("DELETE /api/documents/:id/share-links/:linkId: 204 for owner", async () => {
  const res = await fetch(`${baseUrl}/api/documents/${DOC_ID}/share-links/${LINK_ID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenFor(USER_A)}` },
  });
  assert.equal(res.status, 204);
});

// ── Public token access ───────────────────────────────────────────────────────

test("GET /api/share/:token: 200 returns document metadata and download URL", async () => {
  const res = await fetch(`${baseUrl}/api/share/validtoken123`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.data.document);
  assert.equal(typeof body.data.downloadUrl, "string");
  assert.ok(body.data.expiresAt);
});

test("GET /api/share/:token: 410 when link is revoked", async () => {
  shareCtrl._setModels(fakeDoc, {
    ...fakeSL,
    findOne: async () => ({ ...FAKE_LINK, revokedAt: new Date() }),
  });
  const res = await fetch(`${baseUrl}/api/share/validtoken123`);
  assert.equal(res.status, 410);
  const body = await res.json();
  assert.equal(body.error.code, "SHARE_LINK_REVOKED");
  shareCtrl._setModels(fakeDoc, fakeSL);
});

test("GET /api/share/:token: 410 when link is expired", async () => {
  shareCtrl._setModels(fakeDoc, {
    ...fakeSL,
    findOne: async () => ({ ...FAKE_LINK, expiresAt: new Date(Date.now() - 1000) }),
  });
  const res = await fetch(`${baseUrl}/api/share/validtoken123`);
  assert.equal(res.status, 410);
  const body = await res.json();
  assert.equal(body.error.code, "SHARE_LINK_EXPIRED");
  shareCtrl._setModels(fakeDoc, fakeSL);
});
