/**
 * Zod validation schemas for request validation
 */

import { z } from "zod";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements: min 8 chars, at least one letter, one number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * User registration schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .regex(emailRegex, "Invalid email format")
      .transform(email => email.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(passwordRegex, "Password must contain at least one letter and one number"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .trim(),
  }),
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .transform(email => email.toLowerCase().trim()),
    password: z
      .string()
      .min(1, "Password is required"),
  }),
});

/**
 * Password reset request schema
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .transform(email => email.toLowerCase().trim()),
  }),
});

/**
 * Password reset confirmation schema
 */
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Reset token is required"),
  }),
  body: z.object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(passwordRegex, "Password must contain at least one letter and one number"),
  }),
});

/**
 * Update user profile schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100).trim().optional(),
    avatar: z.string().url("Invalid avatar URL").optional(),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  }),
});

/**
 * Document upload schema
 */
export const uploadDocumentSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters")
      .trim(),
    description: z
      .string()
      .max(2000, "Description must be less than 2000 characters")
      .optional(),
    category: z
      .string()
      .max(50, "Category must be less than 50 characters")
      .optional(),
    tags: z
      .array(z.string().max(30))
      .max(10, "Maximum 10 tags allowed")
      .optional()
      .transform(tags => tags?.map(tag => tag.toLowerCase().trim()).filter(Boolean)),
    expiryDate: z
      .string()
      .datetime()
      .optional(),
  }),
});

/**
 * Document query schema (for listing)
 */
export const documentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    search: z.string().max(100).trim().optional(),
    category: z.string().max(50).optional(),
    tags: z.string().max(200).optional().transform(tags => tags?.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)),
    status: z.enum(["pending", "verified", "rejected", "expired"]).optional(),
    sort: z.enum(["createdAt", "updatedAt", "title", "category"]).default("createdAt").optional(),
    order: z.enum(["asc", "desc"]).default("desc").optional(),
  }),
});

/**
 * Document ID params schema
 */
export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
});

/**
 * Update document schema
 */
export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
  body: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    expiryDate: z.string().datetime().optional(),
  }),
});

/**
 * Create share link schema
 */
export const createShareLinkSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
  body: z.object({
    expiresAt: z.string().datetime().optional(),
    maxViews: z.number().min(1).max(1000).optional(),
    password: z.string().min(6).max(50).optional(),
    canDownload: z.boolean().default(false).optional(),
    canPrint: z.boolean().default(false).optional(),
    watermarked: z.boolean().default(true).optional(),
  }),
});

/**
 * Access share link schema
 */
export const accessShareLinkSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Share token is required"),
  }),
  body: z.object({
    password: z.string().optional(),
  }),
});

/**
 * Verification decision schema
 */
export const verificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
  body: z.object({
    status: z.enum(["verified", "rejected"]),
    comments: z.string().max(1000).optional(),
    expiryDate: z.string().datetime().optional(),
  }),
});

/**
 * Organization create schema
 */
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Organization name is required").max(100).trim(),
    description: z.string().max(500).optional(),
  }),
});

/**
 * Team create schema
 */
export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Team name is required").max(100).trim(),
    description: z.string().max(500).optional(),
  }),
});

/**
 * Invite user schema
 */
export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").transform(email => email.toLowerCase().trim()),
    role: z.enum(["member", "admin", "verifier"]).default("member"),
  }),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * File validation schema (for multer)
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const fileValidationSchema = z.object({
  file: z.object({
    mimetype: z.enum(ALLOWED_MIME_TYPES, { message: "File type not allowed" }),
    size: z.number().max(MAX_FILE_SIZE, "File size exceeds 10MB limit"),
    originalname: z.string().max(255),
  }),
});

/**
 * Comment schema
 */
export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Comment content is required").max(2000),
    parentId: z.string().optional(),
    mentions: z.array(z.string()).optional(),
  }),
});

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    documentShared: z.boolean().optional(),
    documentVerified: z.boolean().optional(),
    expiryReminders: z.boolean().optional(),
    teamUpdates: z.boolean().optional(),
  }),
});