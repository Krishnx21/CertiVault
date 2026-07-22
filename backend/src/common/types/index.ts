/**
 * Common types and interfaces for CertiVault API
 */

import { ObjectId } from "mongoose";

// User roles
export type UserRole = "user" | "admin" | "verifier";

// Document status
export type DocumentStatus = "pending" | "verified" | "rejected" | "expired" | "processing";

// Verification status
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";

// Audit action types
export type AuditAction =
  | "USER_REGISTERED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_PROFILE_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_DELETED"
  | "DOCUMENT_VERIFIED"
  | "DOCUMENT_REJECTED"
  | "SHARE_LINK_CREATED"
  | "SHARE_LINK_ACCESSED"
  | "SHARE_LINK_REVOKED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "SESSION_REVOKED"
  | "ADMIN_ACTION";

// Resource types for audit
export type ResourceType = "user" | "document" | "session" | "shareLink" | "organization" | "team";

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorData;
  meta?: {
    requestId: string;
    timestamp: string;
    duration?: number;
  };
}

// API Error data
export interface ApiErrorData {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  stack?: string;
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iss: string;
  aud: string;
  jti: string;
  iat: number;
  exp: number;
}

// Session data
export interface SessionData {
  sessionId: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
}

// File upload result
export interface UploadResult {
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
}

// Share link permissions
export interface ShareLinkPermissions {
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  watermarked: boolean;
}

// Notification types
export type NotificationType =
  | "document_shared"
  | "document_verified"
  | "document_rejected"
  | "expiry_warning"
  | "mention"
  | "comment"
  | "system";

// Organization membership role
export type OrganizationRole = "owner" | "admin" | "member" | "verifier";

// Team membership role
export type TeamRole = "owner" | "admin" | "member";

// Request context attached to Express request
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

// Database base document
export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Soft delete interface
export interface SoftDelete {
  isDeleted: boolean;
  deletedAt?: Date;
}

// Audit log entry
export interface AuditLog {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  resourceType: ResourceType;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  createdAt: Date;
}

// Email template data
export interface EmailTemplateData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

// Queue job data types
export interface JobData {
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  delay?: number;
}

// Verification workflow step
export interface VerificationStep {
  step: number;
  name: string;
  status: "pending" | "approved" | "rejected" | "skipped";
  verifierId?: string;
  verifiedAt?: Date;
  comments?: string;
}

// Trust score components
export interface TrustScore {
  overall: number;
  integrity: number;
  verification: number;
  ownership: number;
  recency: number;
}