/**
 * Verification Validation Schemas
 * Zod schemas for verification operations
 */

import { z } from "zod";

// Verification status values
const VERIFICATION_STATUS_VALUES = ["all", "verified", "pending", "rejected", "expired", "tampered", "revoked"] as const;

// Verification status values for operations (exclude "all")
const VERIFICATION_STATUS_VALUES_STRICT = ["verified", "pending", "rejected", "expired", "tampered", "revoked"] as const;

// Verification method values
const VERIFICATION_METHOD_VALUES = ["all", "manual", "qr", "public", "hash", "api"] as const;

// Verification method values for operations (exclude "all")
const VERIFICATION_METHOD_VALUES_STRICT = ["manual", "qr", "public", "hash", "api"] as const;

// Verification result values
const VERIFICATION_RESULT_VALUES = ["success", "failure", "mismatch"] as const;

// Verify document schema
export const verifyDocumentSchema = z.object({
  status: z.enum(["verified", "rejected"] as ["verified", "rejected"]),
  method: z.enum(VERIFICATION_METHOD_VALUES_STRICT as unknown as ["manual", "qr", "public", "hash", "api"]),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Re-verify document schema
export const reverifyDocumentSchema = z.object({
  method: z.enum(VERIFICATION_METHOD_VALUES_STRICT as unknown as ["manual", "qr", "public", "hash", "api"]),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Hash verification schema
export const verifyHashSchema = z.object({
  documentHash: z.string().min(1, "Document hash is required").max(128, "Hash too long"),
  checksum: z.string().min(1, "Checksum is required").max(64, "Checksum too long").optional(),
});

// Hash comparison schema
export const compareHashSchema = z.object({
  originalHash: z.string().min(1, "Original hash is required").max(128, "Hash too long"),
  newHash: z.string().min(1, "New hash is required").max(128, "Hash too long"),
});

// Revoke verification schema
export const revokeVerificationSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500, "Reason cannot exceed 500 characters"),
});

// Search verifications schema
export const searchVerificationsSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

// Filter verifications schema
export const filterVerificationsSchema = z.object({
  status: z.enum(VERIFICATION_STATUS_VALUES).optional(),
  method: z.enum(VERIFICATION_METHOD_VALUES).optional(),
  documentId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

// Get verifications schema (with pagination)
export const getVerificationsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  status: z.enum(VERIFICATION_STATUS_VALUES).optional(),
  method: z.enum(VERIFICATION_METHOD_VALUES).optional(),
  search: z.string().optional(),
});

// Public verification schema
export const publicVerifySchema = z.object({
  token: z.string().min(64, "Invalid verification token").max(64, "Invalid verification token"),
});

// Validate verification token format
export const isValidVerificationToken = (token: string): boolean => {
  return /^[a-f0-9]{64}$/.test(token);
};

// Validate hash format (SHA-256)
export const isValidHash = (hash: string): boolean => {
  return /^[a-f0-9]{64}$/i.test(hash);
};

// Validate checksum format
export const isValidChecksum = (checksum: string): boolean => {
  return /^[a-f0-9]{16,64}$/i.test(checksum);
};
