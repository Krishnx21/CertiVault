import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { getDocumentsSchema } from "../../src/modules/documents/document.validation.js";

test("getDocumentsSchema validates cursor and caps limit", () => {
  const result1 = getDocumentsSchema.parse({ limit: "50", cursor: "64f8a1b2c3d4e5f6a7b8c9d0" });
  assert.equal(result1.limit, 50);
  assert.equal(result1.cursor, "64f8a1b2c3d4e5f6a7b8c9d0");
  assert.equal(result1.page, undefined);

  // Test limit capping at 100
  const result2 = getDocumentsSchema.parse({ limit: "250" });
  assert.equal(result2.limit, 100);

  // Test invalid limit defaults to 20
  const result3 = getDocumentsSchema.parse({ limit: "-5" });
  assert.equal(result3.limit, 20);
});

test("cursor ObjectId validation logic", () => {
  const validId = new mongoose.Types.ObjectId().toString();
  assert.equal(mongoose.Types.ObjectId.isValid(validId), true);

  const invalidId = "invalid-cursor-string";
  assert.equal(mongoose.Types.ObjectId.isValid(invalidId), false);
});
