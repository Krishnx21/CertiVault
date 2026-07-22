import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import * as defaultStorage from "../../services/storage.service.js";
import { Document } from "./document.model.js";
import { eventBus } from "../../utils/eventBus.js";

let storage = defaultStorage;
export const _setStorage = (s) => {
  storage = s;
};

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const toResponse = (doc) => ({
  id: doc._id,
  name: doc.name,
  type: doc.type,
  mimeType: doc.mimeType,
  size: doc.size,
  checksum: doc.checksum,
  owner: doc.owner,
  status: doc.status,
  tags: doc.tags,
  createdAt: doc.createdAt,
  verifiedAt: doc.verifiedAt,
});

export const listDocuments = async (req, res, next) => {
  try {
    const { search = "", status = "all", sort = "createdAt", order = "desc" } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const filter = {};
    if (status !== "all") filter.status = status;
    if (search) filter.$text = { $search: search };

    const sortOrder = order === "asc" ? 1 : -1;
    const allowedSortFields = ["createdAt", "name", "size", "status"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";

    const [items, total] = await Promise.all([
      Document.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter),
    ]);

    res.json({ data: items.map(toResponse), total, page, limit });
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));

    const downloadUrl = await storage.getPresignedUrl(doc.s3Key);
    res.json({ data: { ...toResponse(doc), downloadUrl } });
  } catch (err) {
    next(err);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, "FILE_REQUIRED", "Select a file to upload"));

    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return next(new ApiError(415, "UNSUPPORTED_FILE_TYPE", "File type is not allowed"));
    }

    const checksum = createHash("sha256").update(req.file.buffer).digest("hex");
    const s3Key = `documents/${randomUUID()}-${req.file.originalname.replace(/\s+/g, "_")}`;

    const { bucket } = await storage.uploadToS3({
      key: s3Key,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    const doc = await Document.create({
      name: req.file.originalname,
      type: req.body.type || "Other",
      mimeType: req.file.mimetype,
      size: req.file.size,
      checksum,
      owner: req.user.id,
      s3Key,
      s3Bucket: bucket,
      tags: req.body.tags
        ? String(req.body.tags)
            .split(",")
            .map((t) => t.trim())
        : [],
    });

    eventBus.emit("documentCreated", doc);

    res.status(201).json({ data: toResponse(doc) });
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const existing = await Document.findById(req.params.id).lean();
    if (!existing) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    if (existing.owner !== req.user.id)
      return next(
        new ApiError(403, "FORBIDDEN", "You do not have permission to update this document")
      );

    const allowed = ["name", "type", "tags"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const doc = await Document.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    eventBus.emit("documentUpdated", doc);

    res.json({ data: toResponse(doc) });
  } catch (err) {
    next(err);
  }
};

export const verifyDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status: "verified", verifiedAt: new Date() },
      { new: true }
    ).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    
    eventBus.emit("documentUpdated", doc);
    
    res.json({ data: toResponse(doc) });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    if (doc.owner !== req.user.id)
      return next(
        new ApiError(403, "FORBIDDEN", "You do not have permission to delete this document")
      );

    await Document.findByIdAndDelete(req.params.id);
    await storage.deleteFromS3(doc.s3Key);
    
    eventBus.emit("documentDeleted", req.params.id);
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
