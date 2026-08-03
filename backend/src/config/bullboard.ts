/**
 * Bull Board — Admin UI for BullMQ queues
 * Mounts at /admin/queues (basic-auth protected).
 *
 * Required packages (already installed):
 *   @bull-board/express @bull-board/api
 */

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { RequestHandler, Request, Response, NextFunction } from "express";
import { getEmailQueue } from "../queues/email.queue.js";
import { getNotificationQueue } from "../queues/notification.queue.js";
import { createModuleLogger } from "../common/utils/logger.js";

const log = createModuleLogger("bullboard");

// ─── Basic-auth middleware ────────────────────────────────────────────────────
// Credentials must be supplied explicitly — there is no fallback default.

function basicAuth(username: string, password: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
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
} | null {
  // Read credentials directly from process.env (not the cached env snapshot)
  // so they are always current and never fall back to insecure defaults.
  const username = process.env.BULL_BOARD_USERNAME;
  const password = process.env.BULL_BOARD_PASSWORD;

  // The admin UI is disabled unless credentials are explicitly configured.
  // Falling back to hardcoded defaults (admin/changeme) is a security risk.
  if (!username || !password) {
    log.warn(
      "Bull Board: DISABLED because BULL_BOARD_USERNAME and/or BULL_BOARD_PASSWORD " +
        "are not set. Set both environment variables to enable the queue admin UI " +
        "at /admin/queues."
    );
    return null;
  }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  // Only register queues that are actually available (Redis may not be configured)
  const emailQueue = getEmailQueue();
  const notificationQueue = getNotificationQueue();
  const queues = [
    ...(emailQueue ? [new BullMQAdapter(emailQueue)] : []),
    ...(notificationQueue ? [new BullMQAdapter(notificationQueue)] : []),
  ];

  createBullBoard({ queues, serverAdapter });

  if (queues.length > 0) {
    log.info(`Bull Board: initialised (email, notification queues registered)`);
  } else {
    log.warn("Bull Board: initialised with no queues (Redis not configured — queues are disabled)");
  }

  return {
    router: serverAdapter.getRouter(),
    authMiddleware: basicAuth(username, password),
  };
}
