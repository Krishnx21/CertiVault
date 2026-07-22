/**
 * Notification Routes - API routes for notifications
 */

import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  deleteReadNotificationsController,
  deleteAllNotificationsController,
} from "./notification.controller.js";

const router = Router();

/**
 * Get notifications
 */
router.get("/notifications", protect, getNotificationsController);

/**
 * Get unread count
 */
router.get("/notifications/unread-count", protect, getUnreadCountController);

/**
 * Mark notification as read
 */
router.put("/notifications/:notificationId/read", protect, markAsReadController);

/**
 * Mark all as read
 */
router.put("/notifications/read-all", protect, markAllAsReadController);

/**
 * Delete notification
 */
router.delete("/notifications/:notificationId", protect, deleteNotificationController);

/**
 * Delete read notifications
 */
router.delete("/notifications/read", protect, deleteReadNotificationsController);

/**
 * Delete all notifications
 */
router.delete("/notifications", protect, deleteAllNotificationsController);

export default router;
