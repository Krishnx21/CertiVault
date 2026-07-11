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
  getDocumentDownloadUrl,
  getDocumentSummary,
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
 * Upload document
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

    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
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
      ownerId: userId,
      ownerName: (req as any).user?.name || "Unknown",
      ownerEmail: (req as any).user?.email || "",
    });

    res.status(201).json({ data: document });
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents with pagination, filtering, and sorting
 */
export const listDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { page, limit, search, status, category, isFavorite, isArchived, sortBy } =
      getDocumentsSchema.parse(req.query);

    const result = await getDocuments({
      page,
      limit,
      search,
      status,
      category,
      isFavorite,
      isArchived,
      sortBy,
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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await getDocumentById(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const updates = updateDocumentSchema.parse(req.body);

    const document = await updateDocument(id, updates, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    await deleteDocumentService(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const { reason  } = archiveDocumentSchema.parse(req.body);

    const document = await archiveDocument(id, userId, userId, reason);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await restoreDocument(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await favoriteDocument(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const document = await unfavoriteDocument(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const { status, notes } = verifyDocumentSchema.parse(req.body);

    const document = await verifyDocumentService(id, userId, userId, status, notes);

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
    const userId = (req as any).user?.id;
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
    const userId = (req as any).user?.id;
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
    const userId = (req as any).user?.id;
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
    const userId = (req as any).user?.id;
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
 * Get document download URL
 */
export const getDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { id } = req.params;
    const url = await getDocumentDownloadUrl(id, userId);

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
    const userId = (req as any).user?.id;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const summary = await getDocumentSummary(userId);

    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
};
