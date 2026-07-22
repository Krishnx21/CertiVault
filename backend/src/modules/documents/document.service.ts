/**
 * Document Service
 * Business logic for document operations
 */

import { DocumentModel, IDocument } from "./document.model.js";
import {
  uploadToS3,
  deleteFromS3,
  getPresignedDownloadUrl,
  generateChecksum,
  generateHash,
  validateFileType,
  getFileCategory,
  sanitizeFilename,
  StorageProvider,
} from "./s3.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { getExtensionFromMimeType, validateFileSize } from "./document.validation.js";
import path from "path";

interface UploadDocumentInput {
  file: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

interface GetDocumentsInput {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  sortBy?: string;
  ownerId: string;
  startDate?: string;
  endDate?: string;
  owner?: string;
}

interface FilterDocumentsInput {
  category?: string;
  status?: string;
  verificationStatus?: string;
  fileType?: string;
  startDate?: string;
  endDate?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  page: number;
  limit: number;
  ownerId: string;
}

interface SearchDocumentsInput {
  query: string;
  page: number;
  limit: number;
  ownerId: string;
}

/**
 * Upload document
 */
export const uploadDocument = async (input: UploadDocumentInput): Promise<IDocument> => {
  const {
    file,
    originalName,
    mimeType,
    fileSize,
    title,
    description,
    category,
    tags,
    ownerId,
    ownerName,
    ownerEmail,
  } = input;

  // Validate file type
  if (!validateFileType(mimeType)) {
    throw new ApiError(400, "INVALID_FILE_TYPE", "File type not allowed");
  }

  // Validate file size
  if (!validateFileSize(fileSize)) {
    throw new ApiError(400, "FILE_TOO_LARGE", "File size exceeds maximum limit of 50MB");
  }

  // Check for duplicate by checksum
  const checksum = generateChecksum(file);
  const hash = generateHash(file);
  const existingDocument = await DocumentModel.findOne({ checksum, owner: ownerId });
  if (existingDocument) {
    throw new ApiError(409, "DUPLICATE_DOCUMENT", "Document with same content already exists");
  }

  // Upload to storage (S3 → Cloudinary → Local fallback)
  const sanitizedFileName = sanitizeFilename(originalName);
  const { key, url, provider } = await uploadToS3(file, sanitizedFileName, mimeType);

  // Create document record
  const document = await DocumentModel.create({
    title,
    description,
    category,
    owner: ownerId,
    ownerName,
    ownerEmail,
    tags: tags || [],
    status: "pending",
    verificationStatus: "not_verified",
    storageUrl: url,
    storageKey: key,
    storageProvider: provider,
    fileName: sanitizedFileName,
    fileSize,
    mimeType,
    checksum,
    hash,
    isEncrypted: true,
    metadata: {
      originalName,
      extension: getExtensionFromMimeType(mimeType),
    },
  });

  return document.toObject() as unknown as IDocument;
};

/**
 * Get documents with pagination, filtering, and sorting
 */
export const getDocuments = async (input: GetDocumentsInput) => {
  const {
    page,
    limit,
    search,
    status,
    category,
    isFavorite,
    isArchived,
    sortBy,
    ownerId,
    owner,
    startDate,
    endDate,
  } = input;

  const skip = (page - 1) * limit;

  // Build query
  const query: any = {
    owner: ownerId,
    isArchived: isArchived ?? false,
  };

  // Owner filter (if specified, override the default owner filter)
  if (owner && owner !== "all" && owner !== "me") {
    query.owner = owner;
  }

  if (status && status !== "all") {
    query.status = status;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (isFavorite !== undefined) {
    query.isFavorite = isFavorite;
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Build sort
  let sort: any = { createdAt: -1 };
  switch (sortBy) {
    case "oldest":
      sort = { createdAt: 1 };
      break;
    case "title_asc":
      sort = { title: 1 };
      break;
    case "title_desc":
      sort = { title: -1 };
      break;
    case "size_asc":
      sort = { fileSize: 1 };
      break;
    case "size_desc":
      sort = { fileSize: -1 };
      break;
    case "status":
      sort = { status: 1 };
      break;
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
    DocumentModel.countDocuments(query),
  ]);

  return {
    documents: documents as unknown as IDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get document by ID
 */
export const getDocumentById = async (
  id: string,
  ownerId: string
): Promise<IDocument> => {
  const document = await DocumentModel.findOne({ _id: id, owner: ownerId }).lean();
  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  // Update last accessed
  await DocumentModel.findByIdAndUpdate(id, { lastAccessedAt: new Date() });

  return document as unknown as IDocument;
};

/**
 * Update document
 */
export const updateDocument = async (
  id: string,
  updates: Partial<IDocument>,
  ownerId: string
): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    updates,
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Delete document
 */
export const deleteDocument = async (id: string, ownerId: string): Promise<void> => {
  const document = await DocumentModel.findOne({ _id: id, owner: ownerId });
  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  // Delete from S3
  await deleteFromS3(document.storageKey);

  // Delete from database
  await DocumentModel.deleteOne({ _id: id });
};

/**
 * Archive document
 */
export const archiveDocument = async (
  id: string,
  ownerId: string,
  archivedBy: string,
  reason?: string
): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      isArchived: true,
      archivedAt: new Date(),
      archivedBy,
    },
    { returnDocument: "after" }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Restore document
 */
export const restoreDocument = async (id: string, ownerId: string): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      isArchived: false,
      archivedAt: undefined,
      archivedBy: undefined,
    },
    { returnDocument: "after" }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Favorite document
 */
export const favoriteDocument = async (id: string, ownerId: string): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      isFavorite: true,
      favoritedAt: new Date(),
    },
    { returnDocument: "after" }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Unfavorite document
 */
export const unfavoriteDocument = async (id: string, ownerId: string): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      isFavorite: false,
      favoritedAt: undefined,
    },
    { returnDocument: "after" }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Verify document
 */
export const verifyDocument = async (
  id: string,
  ownerId: string,
  verifiedBy: string,
  status: "verified" | "rejected",
  notes?: string
): Promise<IDocument> => {
  const document = await DocumentModel.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      status,
      verificationStatus: status === "verified" ? "verified" : "failed",
      verifiedAt: new Date(),
      verifiedBy,
    },
    { returnDocument: "after" }
  ).lean();

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  return document as unknown as IDocument;
};

/**
 * Search documents
 */
export const searchDocuments = async (input: SearchDocumentsInput) => {
  const { query, page, limit, ownerId } = input;
  const skip = (page - 1) * limit;

  const documents = await DocumentModel.find(
    {
      owner: ownerId,
      isArchived: false,
      $text: { $search: query },
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await DocumentModel.countDocuments({
    owner: ownerId,
    isArchived: false,
    $text: { $search: query },
  });

  return {
    documents: documents as unknown as IDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Filter documents
 */
export const filterDocuments = async (input: FilterDocumentsInput) => {
  const {
    category,
    status,
    verificationStatus,
    fileType,
    startDate,
    endDate,
    isFavorite,
    isArchived,
    page,
    limit,
    ownerId,
  } = input;

  const skip = (page - 1) * limit;

  const query: any = {
    owner: ownerId,
    isArchived: isArchived ?? false,
  };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (verificationStatus) {
    query.verificationStatus = verificationStatus;
  }

  if (fileType) {
    query.mimeType = new RegExp(fileType, "i");
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  if (isFavorite !== undefined) {
    query.isFavorite = isFavorite;
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    DocumentModel.countDocuments(query),
  ]);

  return {
    documents: documents as unknown as IDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get recent documents
 */
export const getRecentDocuments = async (ownerId: string, limit: number = 10) => {
  const documents = await DocumentModel.find({
    owner: ownerId,
    isArchived: false,
  })
    .sort({ lastAccessedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return documents as unknown as IDocument[];
};

/**
 * Get favorite documents
 */
export const getFavoriteDocuments = async (
  ownerId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    DocumentModel.find({
      owner: ownerId,
      isFavorite: true,
      isArchived: false,
    })
      .sort({ favoritedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentModel.countDocuments({
      owner: ownerId,
      isFavorite: true,
      isArchived: false,
    }),
  ]);

  return {
    documents: documents as unknown as IDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get document for streaming (returns document metadata for controller to stream)
 * Accessible by the document owner OR any accepted shared member
 */
export const getDocumentForDownload = async (
  id: string,
  requesterId: string
): Promise<{ document: IDocument; url: string; isLocal: boolean; localKey: string }> => {
  // Try owner first
  let document = await DocumentModel.findOne({ _id: id, owner: requesterId });

  // If not owner, check if the requester is an active vault member of the document's owner
  if (!document) {
    const { VaultMember } = await import("../vault/vaultMember.model.js");

    // Find the document regardless of owner first
    const docById = await DocumentModel.findById(id);
    if (!docById) {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found or access denied");
    }

    // Then verify the requester has active vault membership for that owner
    const vaultAccess = await VaultMember.findOne({
      vaultOwnerId: docById.owner,
      memberUserId: requesterId,
      status: "active",
    });

    if (!vaultAccess) {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found or access denied");
    }

    document = docById;
  }

  // Increment download count
  await DocumentModel.findByIdAndUpdate(id, {
    $inc: { downloadCount: 1 },
    lastAccessedAt: new Date(),
  });

  const isLocal = document.storageProvider === StorageProvider.LOCAL || !document.storageProvider;
  const url = await getPresignedDownloadUrl(
    document.storageKey,
    document.storageProvider as StorageProvider,
    document.fileName
  );

  return {
    document: document as unknown as IDocument,
    url,
    isLocal,
    localKey: document.storageKey,
  };
};

/**
 * Get document download URL
 * Accessible by the document owner OR any accepted shared member
 */
export const getDocumentDownloadUrl = async (
  id: string,
  requesterId: string
): Promise<string> => {
  const { url } = await getDocumentForDownload(id, requesterId);
  return url;
};

/**
 * Get document summary stats
 */
export const getDocumentSummary = async (ownerId: string) => {
  const [total, verified, pending, rejected, archived, favorites, storageBytes] = await Promise.all([
    DocumentModel.countDocuments({ owner: ownerId, isArchived: false }),
    DocumentModel.countDocuments({ owner: ownerId, status: "verified", isArchived: false }),
    DocumentModel.countDocuments({ owner: ownerId, status: "pending", isArchived: false }),
    DocumentModel.countDocuments({ owner: ownerId, status: "rejected", isArchived: false }),
    DocumentModel.countDocuments({ owner: ownerId, isArchived: true }),
    DocumentModel.countDocuments({ owner: ownerId, isFavorite: true, isArchived: false }),
    DocumentModel.aggregate([
      { $match: { owner: ownerId, isArchived: false } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]),
  ]);

  return {
    total,
    verified,
    pending,
    rejected,
    archived,
    favorites,
    storageBytes: storageBytes[0]?.total || 0,
  };
};

/**
 * Get activity timeline for user
 */
export const getActivityTimeline = async (ownerId: string, limit = 20) => {
  const documents = await DocumentModel.find({ owner: ownerId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("title fileName status verifiedAt verifiedBy archivedAt archivedBy favoritedAt createdAt updatedAt ownerName");

  const activities: Array<{
    id: string;
    type: "upload" | "verify" | "favorite" | "archive" | "delete" | "share";
    documentId: string;
    documentTitle: string;
    userId: string;
    userName: string;
    timestamp: string;
    details?: string;
  }> = [];

  documents.forEach((doc) => {
    const docObj = doc.toObject();
    
    // Upload activity
    activities.push({
      id: `${docObj._id}_upload`,
      type: "upload",
      documentId: docObj._id.toString(),
      documentTitle: docObj.title,
      userId: ownerId,
      userName: docObj.ownerName,
      timestamp: docObj.createdAt.toISOString(),
      details: `Uploaded ${docObj.fileName}`,
    });

    // Verification activity
    if (docObj.verifiedAt && docObj.status === "verified") {
      activities.push({
        id: `${docObj._id}_verify`,
        type: "verify",
        documentId: docObj._id.toString(),
        documentTitle: docObj.title,
        userId: (docObj.verifiedBy || ownerId).toString(),
        userName: docObj.verifiedBy ? docObj.verifiedBy.toString() : docObj.ownerName,
        timestamp: docObj.verifiedAt.toISOString(),
        details: `Verified as ${docObj.status}`,
      });
    }

    // Archive activity
    if (docObj.archivedAt && docObj.isArchived) {
      activities.push({
        id: `${docObj._id}_archive`,
        type: "archive",
        documentId: docObj._id.toString(),
        documentTitle: docObj.title,
        userId: (docObj.archivedBy || ownerId).toString(),
        userName: docObj.archivedBy ? docObj.archivedBy.toString() : docObj.ownerName,
        timestamp: docObj.archivedAt.toISOString(),
        details: "Archived document",
      });
    }

    // Favorite activity
    if (docObj.favoritedAt && docObj.isFavorite) {
      activities.push({
        id: `${docObj._id}_favorite`,
        type: "favorite",
        documentId: docObj._id.toString(),
        documentTitle: docObj.title,
        userId: ownerId,
        userName: docObj.ownerName,
        timestamp: docObj.favoritedAt.toISOString(),
        details: "Added to favorites",
      });
    }
  });

  // Sort by timestamp descending and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

/**
 * Get notifications for user
 */
export const getNotifications = async (ownerId: string, limit = 10) => {
  const documents = await DocumentModel.find({ owner: ownerId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("title status verifiedAt createdAt updatedAt");

  const notifications: Array<{
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    documentId?: string;
    documentTitle?: string;
    timestamp: string;
    read: boolean;
  }> = [];

  documents.forEach((doc) => {
    const docObj = doc.toObject();
    
    // Pending verification notification
    if (docObj.status === "pending") {
      notifications.push({
        id: `${docObj._id}_pending`,
        type: "warning",
        title: "Verification Pending",
        message: `"${docObj.title}" is awaiting verification`,
        documentId: docObj._id.toString(),
        documentTitle: docObj.title,
        timestamp: docObj.createdAt.toISOString(),
        read: false,
      });
    }

    // Verified notification
    if (docObj.status === "verified" && docObj.verifiedAt) {
      const hoursSinceVerification = Math.floor(
        (Date.now() - new Date(docObj.verifiedAt).getTime()) / (1000 * 60 * 60)
      );
      if (hoursSinceVerification < 24) {
        notifications.push({
          id: `${docObj._id}_verified`,
          type: "success",
          title: "Document Verified",
          message: `"${docObj.title}" has been successfully verified`,
          documentId: docObj._id.toString(),
          documentTitle: docObj.title,
          timestamp: docObj.verifiedAt.toISOString(),
          read: false,
        });
      }
    }

    // Rejected notification
    if (docObj.status === "rejected") {
      notifications.push({
        id: `${docObj._id}_rejected`,
        type: "error",
        title: "Verification Failed",
        message: `"${docObj.title}" verification was rejected`,
        documentId: docObj._id.toString(),
        documentTitle: docObj.title,
        timestamp: docObj.updatedAt.toISOString(),
        read: false,
      });
    }
  });

  // Sort by timestamp descending and limit
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};
