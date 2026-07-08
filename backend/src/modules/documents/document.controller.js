import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import { documentStore } from "./document.store.js";

export const listDocuments = (req, res) => {
  const query = String(req.query.search ?? "").toLowerCase();
  const status = String(req.query.status ?? "all");
  const items = documentStore.all().filter((document) => {
    const matchesQuery =
      !query || `${document.name} ${document.type}`.toLowerCase().includes(query);
    const matchesStatus = status === "all" || document.status === status;
    return matchesQuery && matchesStatus;
  });

  res.json({ data: items, total: items.length });
};

export const uploadDocument = (req, res, next) => {
  if (!req.file) return next(new ApiError(400, "FILE_REQUIRED", "Select a file to upload"));

  const document = {
    id: randomUUID(),
    name: req.file.originalname,
    type: req.body.type || "Other",
    size: req.file.size,
    status: "pending",
    owner: "Krishna Kumar",
    createdAt: new Date().toISOString(),
    checksum: createHash("sha256").update(req.file.buffer).digest("hex").slice(0, 16),
  };

  res.status(201).json({ data: documentStore.add(document) });
};

export const verifyDocument = (req, res, next) => {
  const document = documentStore.find(req.params.id);
  if (!document) return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
  document.status = "verified";
  document.verifiedAt = new Date().toISOString();
  res.json({ data: document });
};

export const deleteDocument = (req, res, next) => {
  if (!documentStore.remove(req.params.id)) {
    return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
  }
  res.status(204).send();
};
