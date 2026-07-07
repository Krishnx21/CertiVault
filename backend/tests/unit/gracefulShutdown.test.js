import assert from "node:assert/strict";
import { test } from "node:test";
import { createShutdownHandler } from "../../src/utils/gracefulShutdown.js";

test("gracefulShutdown: closes the server and prints a message", () => {
  let closed = false;
  const mockServer = {
    close: (callback) => {
      closed = true;
      callback(null);
    },
  };

  const logs = [];
  const mockLogger = {
    log: (msg) => logs.push(msg),
    error: (msg) => logs.push(msg),
  };

  const handler = createShutdownHandler(mockServer, { logger: mockLogger });
  handler("SIGINT");

  assert.equal(closed, true);
  assert.deepEqual(logs, ["SIGINT received; shutting down"]);
});

test("gracefulShutdown: sets process exitCode on server close error", () => {
  const expectedError = new Error("close error");
  const mockServer = {
    close: (callback) => {
      callback(expectedError);
    },
  };

  const logs = [];
  const mockLogger = {
    log: (msg) => logs.push(msg),
    error: (msg, err) => logs.push(`${msg}: ${err.message}`),
  };

  const mockProcess = {
    exitCode: 0,
  };

  const handler = createShutdownHandler(mockServer, {
    logger: mockLogger,
    processRef: mockProcess,
  });
  handler("SIGTERM");

  assert.equal(mockProcess.exitCode, 1);
  assert.deepEqual(logs, [
    "SIGTERM received; shutting down",
    "Failed to close the HTTP server: close error",
  ]);
});

test("gracefulShutdown: ignores repeated shutdown signals to avoid duplicate work", () => {
  let closeCalls = 0;
  const mockServer = {
    close: (callback) => {
      closeCalls++;
      // don't call callback immediately
    },
  };

  const logs = [];
  const mockLogger = {
    log: (msg) => logs.push(msg),
  };

  const handler = createShutdownHandler(mockServer, { logger: mockLogger });
  handler("SIGINT");
  handler("SIGTERM");

  assert.equal(closeCalls, 1);
  assert.deepEqual(logs, [
    "SIGINT received; shutting down",
    "Shutdown already in progress; ignoring SIGTERM",
  ]);
});
