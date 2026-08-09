process.env.NODE_ENV = "test";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.MONGODB_URI = "mongodb://localhost:27017/test_db";
process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012";
process.env.JWT_REFRESH_SECRET = "12345678901234567890123456789012";

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DocumentModel } from "../../src/modules/documents/document.model.js";
import { getDocuments } from "../../src/modules/documents/document.service.js";
import { ApiError } from "../../src/utils/ApiError.js";

let mongoServer: MongoMemoryServer;
const mockOwnerId = new mongoose.Types.ObjectId().toString();

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Insert 5 test documents
  for (let i = 1; i <= 5; i++) {
    await DocumentModel.create({
      title: `Doc ${i}`,
      category: "contract",
      owner: mockOwnerId,
      ownerName: "Test Owner",
      ownerEmail: "test@example.com",
      status: "verified",
      verificationStatus: "verified",
      storageUrl: `http://localhost/doc${i}.pdf`,
      storageKey: `key_${i}`,
      storageProvider: "local",
      fileName: `doc${i}.pdf`,
      fileSize: 1024 * i,
      mimeType: "application/pdf",
      checksum: `checksum_${i}_${Date.now()}`,
      hash: `hash_${i}`,
      isEncrypted: false,
      isArchived: false,
      isFavorite: false,
      downloadCount: 0,
      metadata: {
        originalName: `doc${i}.pdf`,
        extension: ".pdf",
      },
    });
    // Tiny delay so ObjectIds / createdAt are sequential
    await new Promise((res) => setTimeout(res, 20));
  }
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("cursor pagination page 1 returns limit items and nextCursor", async () => {
  const result = await getDocuments({
    limit: 2,
    ownerId: mockOwnerId,
  });

  assert.equal(result.documents.length, 2);
  assert.notEqual(result.nextCursor, null);
  assert.equal(typeof result.nextCursor, "string");
});

test("cursor pagination page 2 using cursor returns next page items", async () => {
  const page1 = await getDocuments({
    limit: 2,
    ownerId: mockOwnerId,
  });

  assert.equal(page1.documents.length, 2);
  const cursor1 = page1.nextCursor!;

  const page2 = await getDocuments({
    limit: 2,
    cursor: cursor1,
    ownerId: mockOwnerId,
  });

  assert.equal(page2.documents.length, 2);
  assert.notEqual(page2.nextCursor, null);

  // Ensure documents in page 2 are different from page 1
  const page1Ids = page1.documents.map((d: any) => d._id.toString());
  const page2Ids = page2.documents.map((d: any) => d._id.toString());
  assert.equal(page1Ids.some((id) => page2Ids.includes(id)), false);
});

test("cursor pagination page 3 reaches the end with nextCursor null", async () => {
  const page1 = await getDocuments({
    limit: 2,
    ownerId: mockOwnerId,
  });
  const page2 = await getDocuments({
    limit: 2,
    cursor: page1.nextCursor!,
    ownerId: mockOwnerId,
  });

  const page3 = await getDocuments({
    limit: 2,
    cursor: page2.nextCursor!,
    ownerId: mockOwnerId,
  });

  assert.equal(page3.documents.length, 1);
  assert.equal(page3.nextCursor, null);
});

test("invalid cursor throws HTTP 400 ApiError with INVALID_CURSOR", async () => {
  await assert.rejects(
    async () => {
      await getDocuments({
        limit: 2,
        cursor: "malformed-cursor-string",
        ownerId: mockOwnerId,
      });
    },
    (err: any) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, "INVALID_CURSOR");
      return true;
    }
  );
});
