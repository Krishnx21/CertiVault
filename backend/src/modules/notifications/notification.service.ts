/**
 * Notification Service - Handles notification creation and management
 */

import { Notification, NotificationType } from "./notification.model.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Create a notification for a user
 */
export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  expiresAt?: Date;
}) => {
  const notification = await Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
    expiresAt: data.expiresAt,
  });

  return notification;
};

/**
 * Get notifications for a user with pagination
 */
export const getUserNotifications = async (userId: string, options: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) => {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = { userId };
  if (options.unreadOnly) {
    query.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId: string) => {
  const count = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  return count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  if (notification.userId.toString() !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You can only read your own notifications");
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return {
    success: true,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  if (notification.userId.toString() !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You can only delete your own notifications");
  }

  await notification.deleteOne();

  return { success: true, message: "Notification deleted" };
};

/**
 * Delete all read notifications for a user
 */
export const deleteReadNotifications = async (userId: string) => {
  const result = await Notification.deleteMany({
    userId,
    isRead: true,
  });

  return {
    success: true,
    deletedCount: result.deletedCount,
  };
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string) => {
  const result = await Notification.deleteMany({ userId });

  return {
    success: true,
    deletedCount: result.deletedCount,
  };
};

/**
 * Create specific notification types
 */
export const notifyUploadCompleted = async (userId: string, documentTitle: string, documentId: string) => {
  return createNotification({
    userId,
    type: "upload_completed",
    title: "Upload Completed",
    message: `Your document "${documentTitle}" has been successfully uploaded.`,
    data: { documentId, documentTitle, actionUrl: `/documents` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
};

export const notifyVerificationCompleted = async (userId: string, documentTitle: string, documentId: string) => {
  return createNotification({
    userId,
    type: "verification_completed",
    title: "Verification Completed",
    message: `Your document "${documentTitle}" has been verified successfully.`,
    data: { documentId, documentTitle, actionUrl: `/verification/${documentId}` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyVerificationRejected = async (userId: string, documentTitle: string, documentId: string) => {
  return createNotification({
    userId,
    type: "verification_rejected",
    title: "Verification Rejected",
    message: `Your document "${documentTitle}" verification was rejected.`,
    data: { documentId, documentTitle, actionUrl: `/verification/${documentId}` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyShareAccepted = async (userId: string, memberName: string, documentTitle: string) => {
  return createNotification({
    userId,
    type: "share_accepted",
    title: "Share Accepted",
    message: `${memberName} accepted your share invitation for "${documentTitle}".`,
    data: { memberName, documentTitle, actionUrl: `/shared-vaults` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyShareRevoked = async (userId: string, documentTitle: string) => {
  return createNotification({
    userId,
    type: "share_revoked",
    title: "Share Revoked",
    message: `Your access to "${documentTitle}" has been revoked.`,
    data: { documentTitle, actionUrl: `/shared-vaults` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyNewMember = async (userId: string, memberName: string, memberEmail: string, documentTitle: string) => {
  return createNotification({
    userId,
    type: "new_member",
    title: "New Member",
    message: `${memberName} (${memberEmail}) joined your shared document "${documentTitle}".`,
    data: { memberName, memberEmail, documentTitle, actionUrl: `/shared-vaults` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyStorageWarning = async (userId: string, storageUsed: number, storageLimit: number) => {
  const percentage = Math.round((storageUsed / storageLimit) * 100);
  return createNotification({
    userId,
    type: "storage_warning",
    title: "Storage Warning",
    message: `You have used ${percentage}% of your storage (${(storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB / ${(storageLimit / 1024 / 1024 / 1024).toFixed(2)} GB).`,
    data: { storageUsed, storageLimit, actionUrl: `/settings` },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
};

export const notifyDocumentShared = async (userId: string, documentTitle: string, sharedBy: string) => {
  return createNotification({
    userId,
    type: "document_shared",
    title: "Document Shared",
    message: `${sharedBy} shared "${documentTitle}" with you.`,
    data: { documentTitle, sharedBy, actionUrl: `/shared-vaults` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const notifyDocumentVerified = async (userId: string, documentTitle: string, documentId: string) => {
  return createNotification({
    userId,
    type: "document_verified",
    title: "Document Verified",
    message: `Document "${documentTitle}" has been verified.`,
    data: { documentId, documentTitle, actionUrl: `/documents` },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};
