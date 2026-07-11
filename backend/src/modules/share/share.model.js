import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema(
  {
    accessedAt: { type: Date, default: Date.now },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { _id: false }
);

const shareLinkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    owner: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    accessLog: [accessLogSchema],
  },
  { timestamps: true }
);

shareLinkSchema.index({ tokenHash: 1 });
shareLinkSchema.index({ documentId: 1 });
shareLinkSchema.index({ expiresAt: 1 });

export const ShareLink = mongoose.model("ShareLink", shareLinkSchema);
