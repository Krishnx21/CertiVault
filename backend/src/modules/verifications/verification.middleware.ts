/**
 * Verification Middleware
 * Authorization and access control for verification operations
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { VerificationModel } from "./verification.model.js";
import { DocumentModel } from "../documents/document.model.js";

/**
 * Check if user is document owner or admin
 */
export const isDocumentOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.role === "admin";
    const { documentId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    if (isAdmin) {
      return next();
    }

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return next(new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found"));
    }

    if (document.owner.toString() !== userId) {
      return next(new ApiError(403, "FORBIDDEN", "You do not have permission to access this document"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is verification owner or admin
 */
export const isVerificationOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.role === "admin";
    const { verificationId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    if (isAdmin) {
      return next();
    }

    const verification = await VerificationModel.findById(verificationId);
    if (!verification) {
      return next(new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found"));
    }

    if (verification.verifiedBy?.toString() !== userId) {
      return next(new ApiError(403, "FORBIDDEN", "You do not have permission to access this verification"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if verification is not revoked
 */
export const isVerificationNotRevoked = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { verificationId } = req.params;

    const verification = await VerificationModel.findById(verificationId);
    if (!verification) {
      return next(new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found"));
    }

    if (verification.verificationStatus === "revoked") {
      return next(new ApiError(400, "VERIFICATION_REVOKED", "Verification has been revoked"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if verification is not expired
 */
export const isVerificationNotExpired = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { verificationId } = req.params;

    const verification = await VerificationModel.findById(verificationId);
    if (!verification) {
      return next(new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found"));
    }

    if (verification.expiresAt && verification.expiresAt < new Date()) {
      return next(new ApiError(400, "VERIFICATION_EXPIRED", "Verification has expired"));
    }

    next();
  } catch (error) {
    next(error);
  }
};
