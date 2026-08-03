import assert from "node:assert/strict";
import { test } from "node:test";

process.env.MONGODB_URI = "mongodb://localhost:27017/certivault_test";
process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012";
process.env.JWT_REFRESH_SECRET = "12345678901234567890123456789012";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";

test("bullboard: basicAuth disables access in production when BULL_BOARD_PASSWORD is missing", async () => {
  const origEnv = process.env.NODE_ENV;
  const origPass = process.env.BULL_BOARD_PASSWORD;

  process.env.NODE_ENV = "production";
  delete process.env.BULL_BOARD_PASSWORD;

  try {
    const { createBullBoardRouter } = await import(`../../dist/config/bullboard.js?t=${Date.now()}`);
    const { authMiddleware } = createBullBoardRouter();

    let status;
    let jsonBody;

    const req = { headers: { authorization: "Basic " + Buffer.from("admin:changeme").toString("base64") } };
    const res = {
      status(code) {
        status = code;
        return this;
      },
      json(body) {
        jsonBody = body;
        return this;
      },
    };
    const next = () => {};

    authMiddleware(req, res, next);

    assert.equal(status, 503);
    assert.equal(jsonBody.error, "Bull Board is disabled due to missing configuration.");
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origPass) process.env.BULL_BOARD_PASSWORD = origPass;
  }
});
