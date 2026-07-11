/**
 * Document model - MongoDB schema for document metadata
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  owner: mongoose.Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  tags: string[];
  status: "pending" | "verified" | "rejected";
  verificationStatus: "not_verified" | "verified" | "failed";
  storageUrl: string;
  storageKey: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  hash: string;
  isEncrypted: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  isFavorite: boolean;
  favoritedAt?: Date;
  downloadCount: number;
  lastAccessedAt?: Date;
  metadata: {
    originalName: string;
    extension: string;
    dimensions?: { width: number; height: number };
    pageCount?: number;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [255, "Title cannot exceed 255 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["certificate", "contract", "identity", "invoice", "report", "other"],
      default: "other",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
    },
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["not_verified", "verified", "failed"],
      default: "not_verified",
    },
    storageUrl: {
      type: String,
      required: [true, "Storage URL is required"],
    },
    storageKey: {
      type: String,
      required: [true, "Storage key is required"],
      unique: true,
    },
    thumbnailUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    checksum: {
      type: String,
      required: [true, "Checksum is required"],
      index: true,
    },
    hash: {
      type: String,
      required: [true, "Hash is required"],
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    favoritedAt: {
      type: Date,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
    },
    metadata: {
      originalName: {
        type: String,
        required: [true, "Original name is required"],
      },
      extension: {
        type: String,
        required: [true, "Extension is required"],
      },
      dimensions: {
        width: Number,
        height: Number,
      },
      pageCount: Number,
      author: String,
      subject: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
documentSchema.index({ owner: 1, isArchived: 1 });
documentSchema.index({ owner: 1, isFavorite: 1 });
documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ title: "text", description: "text", tags: "text" });

// Compound index for search
documentSchema.index({ owner: 1, isArchived: 1, status: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);