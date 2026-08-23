/**
 * SharedDocument model
 * A single-document, view-only share link (password-on-link).
 *
 * One record = one document shared with (optionally) one recipient via a link.
 * The recipient never gets a CertiVault account; they prove identity by entering
 * the password the owner set, then receive a short-lived scoped "view token".
 *
 * Storage fields (storageKey/storageProvider/mimeType) are snapshotted at share
 * creation so serving the bytes never depends on re-reading the Document, and so
 * this share is unaffected by later metadata edits.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ISharedDocument extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  documentTitle: string;
  documentFileName: string;
  storageKey: string;
  storageProvider: "s3" | "local";
  mimeType: string;
  owner: mongoose.Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  shareToken: string;
  /** bcrypt hash of the link password, or null for an unprotected link */
  passwordHash: string | null;
  /** the person the owner intended to send this to (optional, for the email) */
  recipientEmail: string | null;
  expiresAt: Date | null;
  maxAccessCount: number | null;
  currentAccessCount: number;
  lastAccessedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sharedDocumentSchema = new Schema<ISharedDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    documentTitle: { type: String, required: true },
    documentFileName: { type: String, required: true },
    storageKey: { type: String, required: true },
    storageProvider: { type: String, enum: ["s3", "local"], required: true },
    mimeType: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    shareToken: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: null },
    recipientEmail: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    maxAccessCount: { type: Number, default: null },
    currentAccessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Owner's "existing links" list (most recent first).
sharedDocumentSchema.index({ owner: 1, isActive: 1, createdAt: -1 });

export const SharedDocumentModel = mongoose.model<ISharedDocument>(
  "SharedDocument",
  sharedDocumentSchema
);
