/**
 * Access Log model - MongoDB schema for document access tracking
 */

import mongoose, { Document, Schema } from "mongoose";

export type AccessAction = "view" | "download" | "share" | "revoke" | "invite" | "accept" | "decline";

export interface IAccessLog extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  documentTitle: string;
  sharedDocumentId?: mongoose.Types.ObjectId;
  sharedMemberId?: mongoose.Types.ObjectId;
  shareToken?: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  action: AccessAction;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

const accessLogSchema = new Schema<IAccessLog>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: [true, "Document ID is required"],
      index: true,
    },
    documentTitle: {
      type: String,
      required: [true, "Document title is required"],
    },
    sharedDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "SharedDocument",
      index: true,
    },
    sharedMemberId: {
      type: Schema.Types.ObjectId,
      ref: "SharedMember",
      index: true,
    },
    shareToken: {
      type: String,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      enum: ["view", "download", "share", "revoke", "invite", "accept", "decline"],
      required: [true, "Action is required"],
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
accessLogSchema.index({ documentId: 1, createdAt: -1 });
accessLogSchema.index({ sharedDocumentId: 1, createdAt: -1 });
accessLogSchema.index({ userId: 1, createdAt: -1 });
accessLogSchema.index({ action: 1, createdAt: -1 });
accessLogSchema.index({ shareToken: 1, createdAt: -1 });
accessLogSchema.index({ createdAt: -1 });

// TTL index - keep logs for 90 days
accessLogSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
});

export const AccessLogModel = mongoose.model<IAccessLog>("AccessLog", accessLogSchema);
