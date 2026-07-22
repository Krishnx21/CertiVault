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
    checksum: { type: String, required: true },
    owner: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
    },
    s3Key: { type: String, required: true },
    s3Bucket: { type: String, required: true },
    verifiedAt: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

documentSchema.index({ name: "text", type: "text", owner: "text" });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
