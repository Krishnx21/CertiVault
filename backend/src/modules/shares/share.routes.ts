/**
 * Shares Routes
 *
 * Public routes (the recipient is NOT logged in) are registered BEFORE the
 * protect middleware so they stay open. Owner routes come after and require a
 * valid CertiVault session.
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../../middleware/auth.js";
import {
  createShareController,
  listSharesController,
  revokeShareController,
  getPublicShareController,
  accessShareController,
  getShareFileController,
} from "./share.controller.js";

export const shareRouter = Router();

// Strict limiter to blunt password brute-forcing on the public unlock endpoint.
const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: {
    error: {
      code: "SHARE_ACCESS_RATE_LIMIT_EXCEEDED",
      message: "Too many attempts. Please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public (no auth) — must be registered before protect ──────────────────────
shareRouter.get("/public/:token", getPublicShareController);
shareRouter.post("/public/:token/access", accessLimiter, accessShareController);
shareRouter.get("/public/:token/file", getShareFileController);

// ── Owner (authenticated) ─────────────────────────────────────────────────────
shareRouter.use(protect);
shareRouter.post("/", createShareController);
shareRouter.get("/", listSharesController);
shareRouter.delete("/:shareId", revokeShareController);
