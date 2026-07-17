/**
 * Bull Board — Admin UI for BullMQ queues
 * Mounts at /admin/queues (basic-auth protected).
 *
 * Required packages (install once):
 *   npm install @bull-board/express @bull-board/api
 */

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import type { RequestHandler, Request, Response, NextFunction } from "express";
import { emailQueue } from "../queues/email.queue.js";
import { notificationQueue } from "../queues/notification.queue.js";
import { getEnv } from "./env.js";
import { createModuleLogger } from "../common/utils/logger.js";

const log = createModuleLogger("bullboard");

// ─── Basic-auth middleware ────────────────────────────────────────────────────

function basicAuth(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const env = getEnv();
    const username = env.BULL_BOARD_USERNAME ?? "admin";
    const password = env.BULL_BOARD_PASSWORD ?? "changeme";

    const authHeader = req.headers.authorization ?? "";

    if (!authHeader.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Bull Board"');
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const base64 = authHeader.slice("Basic ".length);
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [user, pass] = decoded.split(":");

    if (user !== username || pass !== password) {
      log.warn("Bull Board: failed auth attempt", {
        ip: req.ip,
        user: user ?? "(none)",
      });
      res.setHeader("WWW-Authenticate", 'Basic realm="Bull Board"');
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    next();
  };
}

// ─── Build the Bull Board Express router ─────────────────────────────────────

export function createBullBoardRouter(): {
  router: ExpressAdapter["getRouter"] extends () => infer R ? R : never;
  authMiddleware: RequestHandler;
} {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(notificationQueue),
    ],
    serverAdapter,
  });

  log.info("Bull Board: initialised (email, notification queues registered)");

  return {
    router: serverAdapter.getRouter(),
    authMiddleware: basicAuth(),
  };
}
