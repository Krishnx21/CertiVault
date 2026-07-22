import { createHash, randomBytes } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import { Document } from "../documents/document.model.js";
import { ShareLink } from "./share.model.js";
import * as defaultStorage from "../../services/storage.service.js";

let storage = defaultStorage;
export const _setStorage = (s) => {
  storage = s;
};

let DocModel = Document;
let SLModel = ShareLink;
export const _setModels = (d, s) => {
  DocModel = d;
  SLModel = s;
};
export const _getModels = () => ({ DocModel, SLModel });

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const toResponse = (link) => ({
  id: link._id,
  documentId: link.documentId,
  expiresAt: link.expiresAt,
  revokedAt: link.revokedAt,
  createdAt: link.createdAt,
  accessCount: link.accessLog.length,
});

export const createShareLink = async (req, res, next) => {
  try {
    const doc = await DocModel.findById(req.params.id).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    if (doc.owner !== req.user.id)
      return next(new ApiError(403, "FORBIDDEN", "Only the document owner can create share links"));

    const { expiresAt } = req.body;
    if (!expiresAt || isNaN(Date.parse(expiresAt)))
      return next(new ApiError(400, "INVALID_EXPIRY", "expiresAt must be a valid ISO date"));

    const expiry = new Date(expiresAt);
    if (expiry <= new Date())
      return next(new ApiError(400, "INVALID_EXPIRY", "expiresAt must be in the future"));

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const link = await SLModel.create({
      documentId: doc._id,
      owner: req.user.id,
      tokenHash,
      expiresAt: expiry,
    });

    res.status(201).json({ data: { ...toResponse(link), token: rawToken } });
  } catch (err) {
    next(err);
  }
};

export const listShareLinks = async (req, res, next) => {
  try {
    const doc = await DocModel.findById(req.params.id).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    if (doc.owner !== req.user.id)
      return next(new ApiError(403, "FORBIDDEN", "Only the document owner can view share links"));

    const links = await SLModel.find({ documentId: doc._id }).lean();
    res.json({ data: links.map(toResponse) });
  } catch (err) {
    next(err);
  }
};

export const revokeShareLink = async (req, res, next) => {
  try {
    const doc = await DocModel.findById(req.params.id).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    if (doc.owner !== req.user.id)
      return next(new ApiError(403, "FORBIDDEN", "Only the document owner can revoke share links"));

    const link = await SLModel.findOneAndUpdate(
      { _id: req.params.linkId, documentId: doc._id, revokedAt: null },
      { revokedAt: new Date() },
      { new: true }
    ).lean();

    if (!link)
      return next(
        new ApiError(404, "SHARE_LINK_NOT_FOUND", "Share link was not found or already revoked")
      );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const accessShareLink = async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.params.token);

    const link = await SLModel.findOne({ tokenHash });
    if (!link) return next(new ApiError(404, "SHARE_LINK_NOT_FOUND", "Share link was not found"));
    if (link.revokedAt)
      return next(new ApiError(410, "SHARE_LINK_REVOKED", "Share link has been revoked"));
    if (link.expiresAt <= new Date())
      return next(new ApiError(410, "SHARE_LINK_EXPIRED", "Share link has expired"));

    const doc = await DocModel.findById(link.documentId).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));

    await SLModel.updateOne(
      { _id: link._id },
      {
        $push: {
          accessLog: {
            accessedAt: new Date(),
            ip: req.ip ?? null,
            userAgent: req.headers["user-agent"] ?? null,
          },
        },
      }
    );

    const downloadUrl = await storage.getPresignedUrl(doc.s3Key);

    res.json({
      data: {
        document: {
          id: doc._id,
          name: doc.name,
          type: doc.type,
          mimeType: doc.mimeType,
          size: doc.size,
          status: doc.status,
          createdAt: doc.createdAt,
        },
        downloadUrl,
        expiresAt: link.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
