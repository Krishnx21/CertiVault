/**
 * Document Validation Schemas
 * Zod schemas for document operations
 */

import { z } from "zod";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/zip",
  "application/x-zip-compressed",
] as const;

// Categories
const CATEGORIES = ["all", "certificate", "contract", "identity", "invoice", "report", "other"] as const;

// Categories for create/update (exclude "all")
const CATEGORIES_STRICT = ["certificate", "contract", "identity", "invoice", "report", "other"] as const;

// Status values
const STATUS_VALUES = ["all", "pending", "verified", "rejected"] as const;

// Verification status values
const VERIFICATION_STATUS_VALUES = ["not_verified", "verified", "failed"] as const;

// Sort options
const SORT_OPTIONS = ["newest", "oldest", "title_asc", "title_desc", "size_asc", "size_desc", "status"] as const;

// Upload document schema
export const uploadDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: z.enum(["certificate", "contract", "identity", "invoice", "report", "other"]),
  tags: z.union([
    z.string().transform((val) => val.split(",").map(t => t.trim()).filter(t => t.length > 0)),
    z.array(z.string().max(50))
  ]).optional().transform((val) => {
    if (Array.isArray(val)) return val;
    return val || [];
  }),
});

// Update document schema
export const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters").optional(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: z.enum(["certificate", "contract", "identity", "invoice", "report", "other"]).optional(),
  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags allowed").optional(),
  status: z.enum(["all", "pending", "verified", "rejected"]).optional(),
});

// Search documents schema
export const searchDocumentsSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

// Filter documents schema
export const filterDocumentsSchema = z.object({
  category: z.enum(["all", "certificate", "contract", "identity", "invoice", "report", "other"]).optional(),
  status: z.enum(["all", "pending", "verified", "rejected"]).optional(),
  verificationStatus: z.enum(["not_verified", "verified", "failed"]).optional(),
  fileType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isFavorite: z.string().optional().transform((val) => val === undefined ? undefined : val === "true"),
  isArchived: z.string().optional().transform((val) => val === undefined ? undefined : val === "true"),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

// Sort documents schema
export const sortDocumentsSchema = z.object({
  sortBy: z.enum(["newest", "oldest", "title_asc", "title_desc", "size_asc", "size_desc", "status"]),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

// Get documents schema (with pagination)
export const getDocumentsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  search: z.string().optional(),
  status: z.enum(["all", "pending", "verified", "rejected"]).optional(),
  category: z.enum(["all", "certificate", "contract", "identity", "invoice", "report", "other"]).optional(),
  isFavorite: z.string().optional().transform((val) => val === undefined ? undefined : val === "true"),
  isArchived: z.string().optional().transform((val) => val === undefined ? undefined : val === "true"),
  sortBy: z.enum(["newest", "oldest", "title_asc", "title_desc", "size_asc", "size_desc", "status"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  owner: z.string().optional(),
});

// Verify document schema
export const verifyDocumentSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Archive document schema
export const archiveDocumentSchema = z.object({
  reason: z.string().max(500, "Reason cannot exceed 500 characters").optional(),
});

// MIME type validation
export const validateMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
};

// File size validation (max 50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const validateFileSize = (size: number): boolean => {
  return size > 0 && size <= MAX_FILE_SIZE;
};

// Get file extension from MIME type
export const getExtensionFromMimeType = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
  };
  return extensions[mimeType] || "";
};
