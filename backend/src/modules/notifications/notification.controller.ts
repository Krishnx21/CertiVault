/**
 * Notification Controller - Handles notification HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  deleteAllNotifications,
} from "./notification.service.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Get user notifications
 */
export const getNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await getUserNotifications(userId, { page, limit, unreadOnly });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count
 */
export const getUnreadCountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const count = await getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markAsReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { notificationId } = req.params;
    const notificationIdStr = Array.isArray(notificationId) ? notificationId[0] : notificationId;

    const notification = await markAsRead(notificationIdStr, userId);

    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const result = await markAllAsRead(userId);

    res.json({
      ...result,
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
export const deleteNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { notificationId } = req.params;
    const notificationIdStr = Array.isArray(notificationId) ? notificationId[0] : notificationId;

    const result = await deleteNotification(notificationIdStr, userId);

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete read notifications
 */
export const deleteReadNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const result = await deleteReadNotifications(userId);

    res.json({
      ...result,
      success: true,
      message: "Read notifications deleted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const result = await deleteAllNotifications(userId);

    res.json({
      ...result,
      success: true,
      message: "All notifications deleted",
    });
  } catch (error) {
    next(error);
  }
};
