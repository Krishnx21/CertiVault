/**
 * Verification Model
 * Document verification and trust engine
 */

import mongoose, { Schema, Model, Document as MongooseDocument } from "mongoose";

export interface IVerification extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  documentTitle: string;
  documentHash: string;
  documentChecksum: string;
  verificationToken: string;
  verificationStatus: "verified" | "pending" | "rejected" | "expired" | "tampered" | "revoked";
  verificationMethod: "manual" | "qr" | "public" | "hash" | "api";
  verificationVersion: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedByUser?: string;
  verifiedAt?: Date;
  lastVerificationDate?: Date;
  verificationAttempts: number;
  qrCodeUrl?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revocationReason?: string;
  verificationHistory: Array<{
    status: string;
    method: string;
    verifiedAt: Date;
    verifiedBy?: string;
    ipAddress?: string;
    userAgent?: string;
    result: "success" | "failure" | "mismatch";
    notes?: string;
  }>;
  metadata: {
    originalFileName: string;
    fileSize: number;
    fileType: string;
    issuer?: string;
    documentType?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSchema: Schema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    documentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    documentHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    documentChecksum: {
      type: String,
      required: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending", "rejected", "expired", "tampered", "revoked"],
      default: "pending",
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: ["manual", "qr", "public", "hash", "api"],
      default: "manual",
    },
    verificationVersion: {
      type: String,
      default: "1.0",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    verifiedByUser: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    lastVerificationDate: {
      type: Date,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    qrCodeUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    revocationReason: {
      type: String,
    },
    verificationHistory: [
      {
        status: String,
        method: String,
        verifiedAt: Date,
        verifiedBy: String,
        ipAddress: String,
        userAgent: String,
        result: {
          type: String,
          enum: ["success", "failure", "mismatch"],
        },
        notes: String,
      },
    ],
    metadata: {
      originalFileName: String,
      fileSize: Number,
      fileType: String,
      issuer: String,
      documentType: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
VerificationSchema.index({ documentId: 1, verificationStatus: 1 });
VerificationSchema.index({ verificationToken: 1, verificationStatus: 1 });
VerificationSchema.index({ verifiedBy: 1, verifiedAt: -1 });
VerificationSchema.index({ createdAt: -1 });
VerificationSchema.index({ documentHash: 1, verificationStatus: 1 });

// Text search index
VerificationSchema.index({
  documentTitle: "text",
  "metadata.issuer": "text",
});

export const VerificationModel: Model<IVerification> =
  mongoose.models.Verification || mongoose.model<IVerification>("Verification", VerificationSchema);
