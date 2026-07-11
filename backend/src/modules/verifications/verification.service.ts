/**
 * Verification Service
 * Business logic for document verification
 */

import { VerificationModel, IVerification } from "./verification.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { generateVerificationToken, generateQRCode, generateQRCodeBuffer } from "./qr.service.js";
import { createAuditLog, getAuditLogs } from "./audit.service.js";
import { ApiError } from "../../utils/ApiError.js";
import crypto from "crypto";
import mongoose from "mongoose";

interface VerifyDocumentInput {
  documentId: string;
  status: "verified" | "rejected";
  method: "manual" | "qr" | "public" | "hash" | "api";
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

interface ReverifyDocumentInput {
  documentId: string;
  method: "manual" | "qr" | "public" | "hash" | "api";
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

interface VerifyHashInput {
  documentHash: string;
  checksum?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface CompareHashInput {
  originalHash: string;
  newHash: string;
}

interface RevokeVerificationInput {
  verificationId: string;
  userId: string;
  userName: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate SHA-256 hash for file buffer
 */
export const generateFileHash = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Verify document
 */
export const verifyDocument = async (input: VerifyDocumentInput): Promise<IVerification> => {
  const { documentId, status, method, userId, userName, ipAddress, userAgent, notes } = input;

  // Get document
  const document = await DocumentModel.findById(documentId);
  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  // Check if verification already exists
  let verification = await VerificationModel.findOne({ documentId });

  if (verification) {
    // Update existing verification
    verification.verificationStatus = status;
    verification.verificationMethod = method;
    verification.verifiedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    verification.verifiedByUser = userName;
    verification.verifiedAt = new Date();
    verification.lastVerificationDate = new Date();
    verification.verificationAttempts += 1;

    // Add to history
    verification.verificationHistory.push({
      status,
      method,
      verifiedAt: new Date(),
      verifiedBy: userName,
      ipAddress,
      userAgent,
      result: status === "verified" ? "success" : "failure",
      notes,
    });

    await verification.save();
  } else {
    // Create new verification
    const verificationToken = generateVerificationToken();
    const { qrCodeUrl } = await generateQRCode(verificationToken);

    verification = await VerificationModel.create({
      documentId: document._id,
      documentTitle: document.title,
      documentHash: document.hash,
      documentChecksum: document.checksum,
      verificationToken,
      verificationStatus: status,
      verificationMethod: method,
      verificationVersion: "1.0",
      verifiedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      verifiedByUser: userName,
      verifiedAt: new Date(),
      lastVerificationDate: new Date(),
      verificationAttempts: 1,
      qrCodeUrl,
      verificationHistory: [
        {
          status,
          method,
          verifiedAt: new Date(),
          verifiedBy: userName,
          ipAddress,
          userAgent,
          result: status === "verified" ? "success" : "failure",
          notes,
        },
      ],
      metadata: {
        originalFileName: document.fileName,
        fileSize: document.fileSize,
        fileType: document.mimeType,
        documentType: document.category,
      },
    });
  }

  // Update document verification status
  await DocumentModel.findByIdAndUpdate(documentId, {
    status,
    verificationStatus: status === "verified" ? "verified" : "failed",
    verifiedAt: new Date(),
    verifiedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  // Create audit log
  await createAuditLog({
    action: "verification",
    entityType: "document",
    entityId: document._id,
    userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    userName,
    ipAddress,
    userAgent,
    result: status === "verified" ? "success" : "failure",
    details: {
      verificationStatus: status,
      verificationMethod: method,
      verificationToken: verification.verificationToken,
      documentHash: document.hash,
      notes,
    },
  });

  return verification.toObject() as unknown as IVerification;
};

/**
 * Re-verify document
 */
export const reverifyDocument = async (input: ReverifyDocumentInput): Promise<IVerification> => {
  const { documentId, method, userId, userName, ipAddress, userAgent, notes } = input;

  // Get document
  const document = await DocumentModel.findById(documentId);
  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  // Get existing verification
  const verification = await VerificationModel.findOne({ documentId });
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  // Check if verification is revoked
  if (verification.verificationStatus === "revoked") {
    throw new ApiError(400, "VERIFICATION_REVOKED", "Verification has been revoked");
  }

  // Re-verify (assume verified for re-verification)
  verification.verificationStatus = "verified";
  verification.verificationMethod = method;
  verification.verifiedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
  verification.verifiedByUser = userName;
  verification.verifiedAt = new Date();
  verification.lastVerificationDate = new Date();
  verification.verificationAttempts += 1;

  // Add to history
  verification.verificationHistory.push({
    status: "verified",
    method,
    verifiedAt: new Date(),
    verifiedBy: userName,
    ipAddress,
    userAgent,
    result: "success",
    notes,
  });

  await verification.save();

  // Update document verification status
  await DocumentModel.findByIdAndUpdate(documentId, {
    status: "verified",
    verificationStatus: "verified",
    verifiedAt: new Date(),
    verifiedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  // Create audit log
  await createAuditLog({
    action: "reverification",
    entityType: "document",
    entityId: document._id,
    userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    userName,
    ipAddress,
    userAgent,
    result: "success",
    details: {
      verificationStatus: "verified",
      verificationMethod: method,
      verificationToken: verification.verificationToken,
      documentHash: document.hash,
      notes,
    },
  });

  return verification.toObject() as unknown as IVerification;
};

/**
 * Get verification by document ID
 */
export const getVerificationByDocumentId = async (
  documentId: string,
  userId?: string
): Promise<IVerification> => {
  const verification = await VerificationModel.findOne({ documentId }).lean();
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  return verification as unknown as IVerification;
};

/**
 * Get verification by token (public)
 */
export const getVerificationByToken = async (token: string): Promise<IVerification> => {
  const verification = await VerificationModel.findOne({ verificationToken: token }).lean();
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  // Check if verification is expired
  if (verification.expiresAt && verification.expiresAt < new Date()) {
    await VerificationModel.findByIdAndUpdate(verification._id, {
      verificationStatus: "expired",
    });
    throw new ApiError(400, "VERIFICATION_EXPIRED", "Verification has expired");
  }

  // Increment verification attempts
  await VerificationModel.findByIdAndUpdate(verification._id, {
    $inc: { verificationAttempts: 1 },
    lastVerificationDate: new Date(),
  });

  return verification as unknown as IVerification;
};

/**
 * Get verification history
 */
export const getVerificationHistory = async (
  documentId: string
): Promise<{ verification: IVerification; auditLogs: any[] }> => {
  const verification = await VerificationModel.findOne({ documentId }).lean();
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  const auditLogs = await getAuditLogs(
    new mongoose.Types.ObjectId(documentId),
    "document"
  );

  return {
    verification: verification as unknown as IVerification,
    auditLogs,
  };
};

/**
 * Verify hash
 */
export const verifyHash = async (input: VerifyHashInput): Promise<{
  status: "verified" | "tampered" | "unknown";
  document?: any;
}> => {
  const { documentHash, checksum, ipAddress, userAgent } = input;

  // Find verification by hash
  const verification = await VerificationModel.findOne({ documentHash }).lean();
  if (!verification) {
    // Create audit log for unknown hash
    await createAuditLog({
      action: "failed_verification",
      entityType: "verification",
      entityId: new mongoose.Types.ObjectId(),
      ipAddress,
      userAgent,
      result: "failure",
      details: {
        documentHash,
        checksum,
      },
    });

    return { status: "unknown" };
  }

  // Verify checksum if provided
  if (checksum && verification.documentChecksum !== checksum) {
    // Update verification status to tampered
    await VerificationModel.findByIdAndUpdate(verification._id, {
      verificationStatus: "tampered",
    });

    // Create audit log for hash mismatch
    await createAuditLog({
      action: "hash_mismatch",
      entityType: "verification",
      entityId: verification._id,
      ipAddress,
      userAgent,
      result: "mismatch",
      details: {
        documentHash,
        expectedChecksum: verification.documentChecksum,
        providedChecksum: checksum,
      },
    });

    return { status: "tampered" };
  }

  // Get document
  const document = await DocumentModel.findById(verification.documentId).lean();

  // Create audit log for successful verification
  await createAuditLog({
    action: "public_verification",
    entityType: "verification",
    entityId: verification._id,
    ipAddress,
    userAgent,
    result: "success",
    details: {
      documentHash,
      checksum,
    },
  });

  return {
    status: "verified",
    document,
  };
};

/**
 * Compare hashes
 */
export const compareHash = async (input: CompareHashInput): Promise<{
  match: boolean;
  result: "match" | "mismatch";
}> => {
  const { originalHash, newHash } = input;

  const match = originalHash.toLowerCase() === newHash.toLowerCase();

  return {
    match,
    result: match ? "match" : "mismatch",
  };
};

/**
 * Revoke verification
 */
export const revokeVerification = async (input: RevokeVerificationInput): Promise<IVerification> => {
  const { verificationId, userId, userName, reason, ipAddress, userAgent } = input;

  const verification = await VerificationModel.findById(verificationId);
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  // Update verification status
  verification.verificationStatus = "revoked";
  verification.revokedAt = new Date();
  verification.revokedBy = new mongoose.Types.ObjectId(userId);
  verification.revocationReason = reason;

  // Add to history
  verification.verificationHistory.push({
    status: "revoked",
    method: "manual",
    verifiedAt: new Date(),
    verifiedBy: userName,
    ipAddress,
    userAgent,
    result: "failure",
    notes: reason,
  });

  await verification.save();

  // Update document status
  await DocumentModel.findByIdAndUpdate(verification.documentId, {
    status: "rejected",
    verificationStatus: "failed",
  });

  // Create audit log
  await createAuditLog({
    action: "revocation",
    entityType: "verification",
    entityId: verification._id,
    userId: new mongoose.Types.ObjectId(userId),
    userName,
    ipAddress,
    userAgent,
    result: "failure",
    details: {
      reason,
      verificationToken: verification.verificationToken,
    },
  });

  return verification.toObject() as unknown as IVerification;
};

/**
 * Get verifications with pagination and filtering
 */
export const getVerifications = async (params: {
  page: number;
  limit: number;
  status?: string;
  method?: string;
  search?: string;
  userId?: string;
}): Promise<{
  verifications: IVerification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit, status, method, search, userId } = params;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (status) {
    query.verificationStatus = status;
  }

  if (method) {
    query.verificationMethod = method;
  }

  if (userId) {
    query.verifiedBy = new mongoose.Types.ObjectId(userId);
  }

  if (search) {
    query.$text = { $search: search };
  }

  const [verifications, total] = await Promise.all([
    VerificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VerificationModel.countDocuments(query),
  ]);

  return {
    verifications: verifications as unknown as IVerification[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get verification statistics
 */
export const getVerificationStatistics = async (userId?: string) => {
  const match: any = {};
  if (userId) {
    match.verifiedBy = new mongoose.Types.ObjectId(userId);
  }

  const stats = await VerificationModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$verificationStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const statistics = {
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    expired: 0,
    tampered: 0,
    revoked: 0,
  };

  stats.forEach((stat) => {
    statistics.total += stat.count;
    if (stat._id in statistics) {
      statistics[stat._id as keyof typeof statistics] = stat.count;
    }
  });

  return statistics;
};

/**
 * Generate QR code for verification
 */
export const generateVerificationQR = async (documentId: string): Promise<{
  qrCodeUrl: string;
  verificationUrl: string;
  verificationToken: string;
}> => {
  const verification = await VerificationModel.findOne({ documentId });
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  const { qrCodeUrl, verificationUrl } = await generateQRCode(verification.verificationToken);

  // Update verification with new QR code
  await VerificationModel.findByIdAndUpdate(verification._id, {
    qrCodeUrl,
  });

  return {
    qrCodeUrl,
    verificationUrl,
    verificationToken: verification.verificationToken,
  };
};

/**
 * Download QR code as PNG
 */
export const downloadQRCode = async (documentId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> => {
  const verification = await VerificationModel.findOne({ documentId });
  if (!verification) {
    throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Verification not found");
  }

  const { buffer } = await generateQRCodeBuffer(verification.verificationToken);

  return {
    buffer,
    filename: `verification-qr-${verification.verificationToken.slice(0, 8)}.png`,
  };
};
