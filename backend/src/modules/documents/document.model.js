import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Certificate", "Contract", "Identity", "Financial", "Other"],
      default: "Other",
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    checksum: { type: String, default: null },
    owner: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
    },
    processing_status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    s3Key: { type: String, default: null },
    s3Bucket: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

documentSchema.index({ name: "text", type: "text", owner: "text" });
documentSchema.index({ status: 1 });
documentSchema.index({ processing_status: 1 });
documentSchema.index({ createdAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
