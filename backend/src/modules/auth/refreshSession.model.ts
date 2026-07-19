/**
 * RefreshSession model - MongoDB schema for JWT refresh token sessions
 * Stores hashed refresh tokens to enable secure logout and token rotation
 */

import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRefreshSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isRevoked(): boolean;
  revoke(): Promise<IRefreshSession>;
}

export interface IRefreshSessionModel extends Model<IRefreshSession> {
  findValidForUser(userId: mongoose.Types.ObjectId): Promise<IRefreshSession[]>;
  findByTokenHash(tokenHash: string): Promise<IRefreshSession | null>;
  deleteAllForUser(userId: mongoose.Types.ObjectId): Promise<any>;
  cleanupExpired(): Promise<any>;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, "Token hash is required"],
      unique: true,
      select: false,
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
    },
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: { expireAfterSeconds: 0 }, // TTL index - auto-delete expired sessions
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user session queries
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

// Instance method: Check if session is expired
refreshSessionSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Instance method: Check if session is revoked
refreshSessionSchema.methods.isRevoked = function (): boolean {
  return this.revokedAt !== null && this.revokedAt !== undefined;
};

// Instance method: Revoke session
refreshSessionSchema.methods.revoke = function (): Promise<IRefreshSession> {
  this.revokedAt = new Date();
  return this.save();
};

// Static method: Find valid sessions for a user
refreshSessionSchema.statics.findValidForUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

// Static method: Find by token hash (intentionally does NOT filter by revokedAt
// so the caller can check revocation status itself — see auth.service.ts)
refreshSessionSchema.statics.findByTokenHash = function (tokenHash: string) {
  return this.findOne({ tokenHash }).select("+tokenHash");
};

// Static method: Delete all sessions for a user (logout all)
refreshSessionSchema.statics.deleteAllForUser = function (userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { userId },
    { $set: { revokedAt: new Date() } }
  );
};

// Static method: Cleanup expired sessions
refreshSessionSchema.statics.cleanupExpired = function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const RefreshSession = mongoose.model<IRefreshSession, IRefreshSessionModel>("RefreshSession", refreshSessionSchema);