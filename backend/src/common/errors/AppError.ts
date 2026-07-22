/**
 * Base application error class
 * All custom errors should extend this class
 */

export interface ErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: ErrorDetails
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// HTTP Error Codes
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  AUTH_MFA_REQUIRED: "AUTH_MFA_REQUIRED",
  AUTH_MFA_INVALID: "AUTH_MFA_INVALID",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_EMAIL_NOT_VERIFIED",
  AUTH_ACCOUNT_DISABLED: "AUTH_ACCOUNT_DISABLED",
  
  // Authorization errors
  AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS",
  AUTH_NOT_OWNER: "AUTH_NOT_OWNER",
  
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  VALIDATION_INVALID_INPUT: "VALIDATION_INVALID_INPUT",
  
  // Resource errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  
  // Document errors
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  DOCUMENT_UPLOAD_FAILED: "DOCUMENT_UPLOAD_FAILED",
  DOCUMENT_PROCESSING_FAILED: "DOCUMENT_PROCESSING_FAILED",
  DOCUMENT_INVALID_TYPE: "DOCUMENT_INVALID_TYPE",
  DOCUMENT_TOO_LARGE: "DOCUMENT_TOO_LARGE",
  DOCUMENT_ALREADY_VERIFIED: "DOCUMENT_ALREADY_VERIFIED",
  DOCUMENT_MALWARE_DETECTED: "DOCUMENT_MALWARE_DETECTED",
  DOCUMENT_DUPLICATE_DETECTED: "DOCUMENT_DUPLICATE_DETECTED",
  
  // Storage errors
  STORAGE_UPLOAD_FAILED: "STORAGE_UPLOAD_FAILED",
  STORAGE_DOWNLOAD_FAILED: "STORAGE_DOWNLOAD_FAILED",
  STORAGE_DELETE_FAILED: "STORAGE_DELETE_FAILED",
  
  // Share link errors
  SHARE_LINK_NOT_FOUND: "SHARE_LINK_NOT_FOUND",
  SHARE_LINK_EXPIRED: "SHARE_LINK_EXPIRED",
  SHARE_LINK_REVOKED: "SHARE_LINK_REVOKED",
  SHARE_LINK_MAX_VIEWS_REACHED: "SHARE_LINK_MAX_VIEWS_REACHED",
  SHARE_LINK_INVALID_TOKEN: "SHARE_LINK_INVALID_TOKEN",
  
  // Verification errors
  VERIFICATION_NOT_PENDING: "VERIFICATION_NOT_PENDING",
  VERIFICATION_ALREADY_COMPLETED: "VERIFICATION_ALREADY_COMPLETED",
  VERIFICATION_INSUFFICIENT_EVIDENCE: "VERIFICATION_INSUFFICIENT_EVIDENCE",
  
  // Organization errors
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  ORGANIZATION_ALREADY_EXISTS: "ORGANIZATION_ALREADY_EXISTS",
  ORGANIZATION_INVITE_EXPIRED: "ORGANIZATION_INVITE_EXPIRED",
  ORGANIZATION_INVITE_INVALID: "ORGANIZATION_INVITE_INVALID",
  
  // Team errors
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  TEAM_ALREADY_EXISTS: "TEAM_ALREADY_EXISTS",
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  
  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE: "EXTERNAL_SERVICE_UNAVAILABLE",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  
  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
} as const;

// Specific error classes
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: ErrorDetails) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_INVALID_INPUT,
      true,
      details
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", code: string = ERROR_CODES.AUTH_TOKEN_INVALID) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", code: string = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS) {
    super(message, HTTP_STATUS.FORBIDDEN, code, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", code: string = ERROR_CODES.RESOURCE_NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, code, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict", code: string = ERROR_CODES.RESOURCE_CONFLICT) {
    super(message, HTTP_STATUS.CONFLICT, code, true);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED, true);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = "Unprocessable entity", details?: ErrorDetails) {
    super(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      true,
      details
    );
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service unavailable") {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_UNAVAILABLE, false);
  }
}

// Domain-specific errors
export class AuthenticationError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.AUTH_INVALID_CREDENTIALS) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, true);
  }
}

export class DocumentError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.DOCUMENT_UPLOAD_FAILED) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, true, details);
  }
}

export class ShareLinkError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.SHARE_LINK_INVALID_TOKEN) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, true);
  }
}

export class OrganizationError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.ORGANIZATION_NOT_FOUND) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, true);
  }
}

/**
 * Error handler for async operations
 * Wraps async route handlers to catch errors and pass them to Express error handler
 */
export const asyncHandler = <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => {
  return (...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      // If error is already an AppError, pass it directly
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerError(error instanceof Error ? error.message : "Unknown error");
    });
  };
};