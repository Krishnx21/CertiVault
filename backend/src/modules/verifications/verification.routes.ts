/**
 * Verification Routes
 * All verification-related API endpoints
 */

import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { rateLimit } from "express-rate-limit";
import {
  verifyDocument,
  reverifyDocument,
  getVerification,
  getVerificationHistoryController,
  publicVerify,
  verifyHash,
  compareHash,
  revokeVerification,
  getVerificationsController,
  searchVerificationsController,
  filterVerificationsController,
  getStatistics,
  generateQR,
  downloadQR,
} from "./verification.controller.js";

export const verificationRouter = Router();

// Public verification endpoint (rate limited)
const publicVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many verification attempts, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
verificationRouter.get("/public/:token", publicVerificationLimiter, publicVerify);

// Protected routes
verificationRouter.use(protect);

// Verification operations
verificationRouter.post("/documents/:documentId/verify", verifyDocument);
verificationRouter.post("/documents/:documentId/reverify", reverifyDocument);
verificationRouter.get("/documents/:documentId", getVerification);
verificationRouter.get("/documents/:documentId/history", getVerificationHistoryController);

// Hash verification
verificationRouter.post("/hash", verifyHash);
verificationRouter.post("/hash/compare", compareHash);

// Verification management
verificationRouter.post("/:verificationId/revoke", revokeVerification);

// Verification listing
verificationRouter.get("/", getVerificationsController);
verificationRouter.get("/search", searchVerificationsController);
verificationRouter.get("/filter", filterVerificationsController);
verificationRouter.get("/statistics", getStatistics);

// QR code generation
verificationRouter.post("/documents/:documentId/qr", generateQR);
verificationRouter.get("/documents/:documentId/qr/download", downloadQR);
