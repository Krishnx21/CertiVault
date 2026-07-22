import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError.js";
import {
  uploadDocument as uploadDocumentService,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument as deleteDocumentService,
  archiveDocument,
  restoreDocument,
  favoriteDocument,
  unfavoriteDocument,
  verifyDocument as verifyDocumentService,
  searchDocuments,
  filterDocuments,
  getRecentDocuments,
  getFavoriteDocuments,
  getDocumentForDownload,
  getDocumentDownloadUrl,
  getDocumentSummary,
  getActivityTimeline,
  getNotifications,
} from "./document.service.js";
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  searchDocumentsSchema,
  filterDocumentsSchema,
  sortDocumentsSchema,
  getDocumentsSchema,
  verifyDocumentSchema,
  archiveDocumentSchema,
} from "./document.validation.js";

/**
 * Upload document — owner uploads to their own vault,
 * or an editor uploads to a vault they have editor access to.
 */
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(new ApiError(400, "FILE_REQUIRED", "No file provided"));
    }

    const { title, description, category, tags } = uploadDocumentSchema.parse(req.body);

    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    // Editor uploading to someone else's vault
    const vaultOwnerId = req.body.vaultOwnerId as string | undefined;
    let effectiveOwnerId = userId;
    let effectiveOwnerName = (req as any).user?.name || "Unknown";
    let effectiveOwnerEmail = (req as any).user?.email || "";

    if (vaultOwnerId && vaultOwnerId !== userId) {
      const { assertVaultAccess } = await import("../vault/vault.service.js");
      const membership = await assertVaultAccess(vaultOwnerId, userId);
      if (membership.role !== "editor") {
        return next(new ApiError(403, "VIEWER_CANNOT_UPLOAD", "Viewers cannot upload documents"));
      }
      // Document owner becomes the vault owner
      const { User } = await import("../users/user.model.js");
      const owner = await User.findById(vaultOwnerId).select("name email");
      effectiveOwnerId = vaultOwnerId;
      effectiveOwnerName = owner?.name ?? "Unknown";
      effectiveOwnerEmail = owner?.email ?? "";
    }

    const document = await uploadDocumentService({
      file: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      title,
      description,
      category,
      tags,
      ownerId: effectiveOwnerId,
      ownerName: effectiveOwnerName,
      ownerEmail: effectiveOwnerEmail,
    });

    res.status(201).json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * List documents — owner's own docs, or a vault member viewing a shared vault.
 * Vault access: GET /api/documents?vaultOwnerId=:id
 */
export const listDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    // ── Vault member path ────────────────────────────────────────────────────
    const vaultOwnerId = req.query.vaultOwnerId as string | undefined;
    if (vaultOwnerId && vaultOwnerId !== userId) {
      // Dynamically import to avoid circular deps
      const { assertVaultAccess } = await import("../vault/vault.service.js");
      await assertVaultAccess(vaultOwnerId, userId); // throws 403 if not active member

      const queryToParse = { ...req.query };
      if (queryToParse.status === "all") delete queryToParse.status;
      delete queryToParse.vaultOwnerId;

      const { page, limit, search, status, category, isFavorite, isArchived, sortBy, startDate, endDate } =
        getDocumentsSchema.parse(queryToParse);

      const result = await getDocuments({
        page,
        limit,
        search,
        status,
        category,
        isFavorite,
        isArchived,
        sortBy,
        startDate,
        endDate,
        ownerId: vaultOwnerId, // fetch owner's documents
      });

      res.json(result);
      return;
    }

    // ── Normal owner path ────────────────────────────────────────────────────
    const queryToParse = { ...req.query };
    if (queryToParse.status === "all") delete queryToParse.status;

    const { page, limit, search, status, category, isFavorite, isArchived, sortBy, startDate, endDate, owner } =
      getDocumentsSchema.parse(queryToParse);

    const result = await getDocuments({
      page,
      limit,
      search,
      status,
      category,
      isFavorite,
      isArchived,
      sortBy,
      startDate,
      endDate,
      owner,
      ownerId: userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get document by ID
 */
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await getDocumentById(Array.isArray(id) ? id[0] : id, userId);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document
 */
export const patchDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const updates = updateDocumentSchema.parse(req.body) as Partial<{
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
      status?: "pending" | "verified" | "rejected";
    }>;

    const document = await updateDocument(Array.isArray(id) ? id[0] : id, updates, userId);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    await deleteDocumentService(Array.isArray(id) ? id[0] : id, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Archive document
 */
export const archiveDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const { reason  } = archiveDocumentSchema.parse(req.body);

    const document = await archiveDocument(Array.isArray(id) ? id[0] : id, userId, userId, reason);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore document
 */
export const restoreDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await restoreDocument(Array.isArray(id) ? id[0] : id, userId);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Favorite document
 */
export const favoriteDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await favoriteDocument(Array.isArray(id) ? id[0] : id, userId);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfavorite document
 */
export const unfavoriteDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await unfavoriteDocument(Array.isArray(id) ? id[0] : id, userId);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify document
 */
export const verifyDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const { status, notes } = verifyDocumentSchema.parse(req.body);

    const document = await verifyDocumentService(Array.isArray(id) ? id[0] : id, userId, userId, status as "verified" | "rejected", notes);

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Search documents
 */
export const searchDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { query, page, limit } = searchDocumentsSchema.parse(req.query);

    const result = await searchDocuments({
      query,
      page,
      limit,
      ownerId: userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Filter documents
 */
export const filterDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const filters = filterDocumentsSchema.parse(req.query);

    const result = await filterDocuments({
      ...filters,
      ownerId: userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent documents
 */
export const getRecentDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const documents = await getRecentDocuments(userId, limit);

    res.json({ data: documents });
  } catch (error) {
    next(error);
  }
};

/**
 * Get favorite documents
 */
export const getFavoriteDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getFavoriteDocuments(userId, page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get document download URL or stream the file directly for local storage
 */
export const getDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const { document, url, isLocal, localKey } = await getDocumentForDownload(
      Array.isArray(id) ? id[0] : id,
      userId
    );

    if (isLocal) {
      // Stream the file directly from local storage so the frontend
      // doesn't have to resolve a relative URL against the wrong origin
      const path = await import("path");
      const fs = await import("fs");
      const { existsSync } = fs;

      const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads", "documents");
      const filePath = path.join(LOCAL_STORAGE_DIR, localKey);

      if (!existsSync(filePath)) {
        return next(new ApiError(404, "FILE_NOT_FOUND", "File not found on disk"));
      }

      const filename = (document as any).fileName || path.basename(filePath);
      const mimeType = (document as any).mimeType || "application/octet-stream";

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.on("error", (err) => next(err));
      fileStream.pipe(res);
      return;
    }

    // For S3 presigned URLs — return the URL for the frontend to redirect to
    res.json({ data: { url } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document summary stats
 */
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const summary = await getDocumentSummary(userId);

    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity timeline
 */
export const getActivityTimelineController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await getActivityTimeline(userId, limit);

    res.json({ data: activities });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notifications
 */
export const getNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const notifications = await getNotifications(userId, limit);

    res.json({ data: notifications });
  } catch (error) {
    next(error);
  }
};
