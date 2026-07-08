import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "verified" | "pending";
  owner: string;
  createdAt: string;
  checksum: string;
  verifiedAt?: string;
}

export interface IDocumentDocument extends IDocument, MongooseDocument {}

const DocumentSchema = new Schema<IDocumentDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, enum: ["verified", "pending"], default: "pending" },
  owner: { type: String, required: true },
  createdAt: { type: String, required: true },
  checksum: { type: String, required: true },
  verifiedAt: { type: String },
});

export const DocumentModel = mongoose.model<IDocumentDocument>("Document", DocumentSchema);
