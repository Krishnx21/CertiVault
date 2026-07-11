import { Request, Response, NextFunction } from "express";
import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import { documentStore } from "./document.store.js";
import { IDocument } from "./document.model.js";
import { eventBus } from "../../core/events.js";

export const listDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = String(req.query.search ?? "").toLowerCase();
    const status = String(req.query.status ?? "all");
    const allItems = await documentStore.all();
    const items = allItems.filter((document) => {
      const matchesQuery =
        !query || `${document.name} ${document.type}`.toLowerCase().includes(query);
      const matchesStatus = status === "all" || document.status === status;
      return matchesQuery && matchesStatus;
    });

    res.json({ data: items, total: items.length });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(new ApiError(400, "FILE_REQUIRED", "Select a file to upload"));
    }

    const document: any = {
      id: randomUUID(),
      name: req.file.originalname,
      type: String(req.body.type || "Other"),
      size: req.file.size,
      status: "pending",
      owner: "Krishna Kumar",
      createdAt: new Date(),
      checksum: createHash("sha256").update(req.file.buffer).digest("hex").slice(0, 16),
    };

    const added = await documentStore.add(document);
    eventBus.emit("document.created", { document: added });
    res.status(201).json({ data: added });
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const document = await documentStore.find(id);
    if (!document) {
      return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    }

    const updated = await documentStore.update(id, {
      status: "verified",
      verifiedAt: new Date(),
    } as any);

    if (updated) {
      eventBus.emit("document.verified", { document: updated });
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const document = await documentStore.find(id);
    const size = document?.size || 0;
    const deleted = await documentStore.remove(id);
    if (!deleted) {
      return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found"));
    }
    eventBus.emit("document.deleted", { documentId: id, size });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
