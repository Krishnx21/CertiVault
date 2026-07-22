/**
 * Notification model - MongoDB schema for user notifications
 */

import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "upload_completed"
  | "verification_completed"
  | "verification_rejected"
  | "share_accepted"
  | "share_revoked"
  | "new_member"
  | "storage_warning"
  | "document_shared"
  | "document_verified";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    documentId?: string;
    documentTitle?: string;
    documentFileName?: string;
    shareId?: string;
    memberId?: string;
    memberName?: string;
    memberEmail?: string;
    verificationId?: string;
    storageUsed?: number;
    storageLimit?: number;
    actionUrl?: string;
  };
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "upload_completed",
        "verification_completed",
        "verification_rejected",
        "share_accepted",
        "share_revoked",
        "new_member",
        "storage_warning",
        "document_shared",
        "document_verified",
      ],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Pre-find middleware to filter out expired notifications
// Include documents where expiresAt is null/undefined (never expires) OR is in the future
notificationSchema.pre("find", function (this: mongoose.QueryWithHelpers<unknown, unknown>) {
  this.where({
    $or: [
      { expiresAt: null },
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
});

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
