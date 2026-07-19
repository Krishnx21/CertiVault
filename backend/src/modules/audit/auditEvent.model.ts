/**
 * AuditEvent model - MongoDB schema for security audit logging
 * Append-only log of all security-sensitive actions
 */

import mongoose, { Document, Schema } from "mongoose";
import { AuditAction, ResourceType } from "../../common/types/index.js";

export interface IAuditEvent extends Document {
  _id: mongoose.Types.ObjectId;
  action: AuditAction;
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  actorName?: string;
  resourceType: ResourceType;
  resourceId?: mongoose.Types.ObjectId | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  createdAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "USER_REGISTERED",
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_PROFILE_UPDATED",
        "DOCUMENT_UPLOADED",
        "DOCUMENT_VIEWED",
        "DOCUMENT_DOWNLOADED",
        "DOCUMENT_UPDATED",
        "DOCUMENT_DELETED",
        "DOCUMENT_VERIFIED",
        "DOCUMENT_REJECTED",
        "SHARE_LINK_CREATED",
        "SHARE_LINK_ACCESSED",
        "SHARE_LINK_REVOKED",
        "PASSWORD_RESET",
        "PASSWORD_CHANGED",
        "MFA_ENABLED",
        "MFA_DISABLED",
        "SESSION_REVOKED",
        "ADMIN_ACTION",
      ],
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    actorEmail: {
      type: String,
    },
    actorName: {
      type: String,
    },
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["user", "document", "session", "shareLink", "organization", "team"],
    },
    resourceId: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    requestId: {
      type: String,
      required: [true, "Request ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditEventSchema.index({ actorId: 1, createdAt: -1 });
auditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });
auditEventSchema.index({ createdAt: -1 });

// Static method: Create audit event
auditEventSchema.statics.createEvent = async function (data: {
  action: AuditAction;
  actorId?: mongoose.Types.ObjectId | string;
  actorEmail?: string;
  actorName?: string;
  resourceType: ResourceType;
  resourceId?: mongoose.Types.ObjectId | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
}): Promise<IAuditEvent> {
  return this.create(data);
};

// Static method: Find events for a resource
auditEventSchema.statics.findByResource = function (
  resourceType: ResourceType,
  resourceId: mongoose.Types.ObjectId | string
) {
  return this.find({ resourceType, resourceId }).sort({ createdAt: -1 });
};

// Static method: Find events by actor
auditEventSchema.statics.findByActor = function (actorId: mongoose.Types.ObjectId | string) {
  return this.find({ actorId }).sort({ createdAt: -1 });
};

// Static method: Find events by action type
auditEventSchema.statics.findByAction = function (action: AuditAction) {
  return this.find({ action }).sort({ createdAt: -1 });
};

// Static method: Find events in time range
auditEventSchema.statics.findInTimeRange = function (
  startTime: Date,
  endTime: Date,
  limit: number = 100
) {
  return this.find({
    createdAt: {
      $gte: startTime,
      $lte: endTime,
    },
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method: Cleanup old events (retention policy)
auditEventSchema.statics.cleanupOldEvents = function (retentionDays: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
  });
};

export const AuditEvent = mongoose.model<IAuditEvent>("AuditEvent", auditEventSchema);