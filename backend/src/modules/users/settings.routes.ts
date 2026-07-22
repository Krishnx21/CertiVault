/**
 * Settings Routes - API routes for user settings
 */

import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import {
  getProfileController,
  updateProfileController,
  changePasswordController,
  updateEmailController,
  updateNotificationPreferencesController,
  deleteAccountController,
  generateAvatarController,
  getSessionsController,
  revokeAllSessionsController,
  revokeSessionController,
} from "./settings.controller.js";

const router = Router();

/**
 * Profile Routes
 */
router.get("/settings/profile", protect, getProfileController);
router.put("/settings/profile", protect, updateProfileController);
router.get("/settings/avatar", generateAvatarController);

/**
 * Security Routes
 */
router.post("/settings/password", protect, changePasswordController);
router.post("/settings/email", protect, updateEmailController);

/**
 * Notification Routes
 */
router.put("/settings/notifications", protect, updateNotificationPreferencesController);

/**
 * Account Routes
 */
router.delete("/settings/account", protect, deleteAccountController);

/**
 * Session Routes
 */
router.get("/settings/sessions", protect, getSessionsController);
router.post("/settings/sessions/revoke-all", protect, revokeAllSessionsController);
router.delete("/settings/sessions/:sessionId", protect, revokeSessionController);

export default router;
