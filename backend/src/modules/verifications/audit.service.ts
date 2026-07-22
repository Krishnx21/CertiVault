/**
 * Audit Logging Service
 * Tracks verification activities for audit trail
 */

import mongoose, { Schema, Model, Document as MongooseDocument } from "mongoose";

export interface IAuditLog extends MongooseDocument {
  action: "verification" | "reverification" | "failed_verification" | "public_verification" | "hash_mismatch" | "revocation" | "qr_generation" | "download";
  entityType: "document" | "verification";
  entityId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  result: "success" | "failure" | "mismatch";
  details: {
    verificationStatus?: string;
    verificationMethod?: string;
    verificationToken?: string;
    documentHash?: string;
    checksum?: string;
    reason?: string;
    notes?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      enum: ["verification", "reverification", "failed_verification", "public_verification", "hash_mismatch", "revocation", "qr_generation", "download"],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["document", "verification"],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userName: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    result: {
      type: String,
      enum: ["success", "failure", "mismatch"],
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityId: 1, action: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

/**
 * Create audit log entry
 */
export const createAuditLog = async (data: {
  action: IAuditLog["action"];
  entityType: IAuditLog["entityType"];
  entityId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  result: IAuditLog["result"];
  details?: IAuditLog["details"];
}): Promise<IAuditLog> => {
  return await AuditLogModel.create(data);
};

/**
 * Get audit logs for entity
 */
export const getAuditLogs = async (
  entityId: mongoose.Types.ObjectId,
  entityType: string,
  limit: number = 50
): Promise<IAuditLog[]> => {
  const logs = await AuditLogModel.find({ entityId, entityType } as any)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
  return logs as unknown as IAuditLog[];
};

/**
 * Get audit logs for user
 */
export const getUserAuditLogs = async (
  userId: mongoose.Types.ObjectId,
  limit: number = 50
): Promise<IAuditLog[]> => {
  const logs = await AuditLogModel.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
  return logs as unknown as IAuditLog[];
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async (startDate?: Date, endDate?: Date) => {
  const match: any = {};
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }

  const stats = await AuditLogModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$result", "success"] }, 1, 0] },
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ["$result", "failure"] }, 1, 0] },
        },
        mismatchCount: {
          $sum: { $cond: [{ $eq: ["$result", "mismatch"] }, 1, 0] },
        },
      },
    },
  ]);

  return stats;
};
