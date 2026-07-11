import test from "node:test";
import assert from "node:assert";
import { eventBus } from "../../src/core/events.js";

test("EventBus - should emit and listen to strongly typed events", () => {
  let receivedPayload: any = null;

  const handler = (payload: any) => {
    receivedPayload = payload;
  };

  eventBus.on("document.created", handler);

  const mockDocument = {
    id: "test-id",
    name: "test.pdf",
    type: "Certificate",
    size: 1024,
    status: "pending" as const,
    owner: "Owner",
    createdAt: new Date().toISOString(),
    checksum: "abcd",
  };

  eventBus.emit("document.created", { document: mockDocument });

  assert.deepStrictEqual(receivedPayload, { document: mockDocument });

  // Cleanup
  eventBus.off("document.created", handler);
});

test("EventBus - should not receive events after off()", () => {
  let callCount = 0;

  const handler = () => {
    callCount++;
  };

  eventBus.on("document.requestSync", handler);
  eventBus.emit("document.requestSync", undefined as void);
  assert.strictEqual(callCount, 1);

  eventBus.off("document.requestSync", handler);
  eventBus.emit("document.requestSync", undefined as void);
  assert.strictEqual(callCount, 1);
});
