/**
 * Verification Controller
 * Handles all verification-related HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError.js";
import {
  verifyDocument as verifyDocumentService,
  reverifyDocument as reverifyDocumentService,
  getVerificationByDocumentId,
  getVerificationByToken,
  getVerificationHistory,
  verifyHash as verifyHashService,
  compareHash as compareHashService,
  revokeVerification as revokeVerificationService,
  getVerifications,
  getVerificationStatistics,
  generateVerificationQR,
  downloadQRCode,
} from "./verification.service.js";
import {
  verifyDocumentSchema,
  reverifyDocumentSchema,
  verifyHashSchema,
  compareHashSchema,
  revokeVerificationSchema,
  searchVerificationsSchema,
  filterVerificationsSchema,
  getVerificationsSchema,
  publicVerifySchema,
} from "./verification.validation.js";

/**
 * Verify document
 */
export const verifyDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    const { status, method, notes } = verifyDocumentSchema.parse(req.body);

    const verification = await verifyDocumentService({
      documentId: Array.isArray(documentId) ? documentId[0] : documentId,
      status,
      method,
      userId,
      userName,
      ipAddress,
      userAgent,
      notes,
    });

    res.status(201).json({ data: verification });
  } catch (error) {
    next(error);
  }
};

/**
 * Re-verify document
 */
export const reverifyDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    const { method, notes } = reverifyDocumentSchema.parse(req.body);

    const verification = await reverifyDocumentService({
      documentId: Array.isArray(documentId) ? documentId[0] : documentId,
      method,
      userId,
      userName,
      ipAddress,
      userAgent,
      notes,
    });

    res.json({ data: verification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification by document ID
 */
export const getVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.id;

    const verification = await getVerificationByDocumentId(
      Array.isArray(documentId) ? documentId[0] : documentId,
      userId
    );

    res.json({ data: verification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification history
 */
export const getVerificationHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;

    const result = await getVerificationHistory(
      Array.isArray(documentId) ? documentId[0] : documentId
    );

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Public verification by token
 */
export const publicVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    const verification = await getVerificationByToken(
      Array.isArray(token) ? token[0] : token
    );

    // Create audit log for public verification
    // (This is done inside the service, but we can add additional tracking here if needed)

    res.json({ data: verification });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify hash
 */
export const verifyHash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    const { documentHash, checksum } = verifyHashSchema.parse(req.body);

    const result = await verifyHashService({
      documentHash,
      checksum,
      ipAddress,
      userAgent,
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare hashes
 */
export const compareHash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { originalHash, newHash } = compareHashSchema.parse(req.body);

    const result = await compareHashService({
      originalHash,
      newHash,
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke verification
 */
export const revokeVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { verificationId } = req.params;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { reason } = revokeVerificationSchema.parse(req.body);

    const verification = await revokeVerificationService({
      verificationId: Array.isArray(verificationId) ? verificationId[0] : verificationId,
      userId,
      userName,
      reason,
      ipAddress,
      userAgent,
    });

    res.json({ data: verification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verifications with pagination and filtering
 */
export const getVerificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const { page, limit, status, method, search } = getVerificationsSchema.parse(req.query);

    const result = await getVerifications({
      page,
      limit,
      status,
      method,
      search,
      userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search verifications
 */
export const searchVerificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const { query, page, limit } = searchVerificationsSchema.parse(req.query);

    const result = await getVerifications({
      page,
      limit,
      search: query,
      userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Filter verifications
 */
export const filterVerificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const filters = filterVerificationsSchema.parse(req.query);

    const result = await getVerifications({
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      method: filters.method as any,
      userId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification statistics
 */
export const getStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const statistics = await getVerificationStatistics(userId);

    res.json({ data: statistics });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate QR code for verification
 */
export const generateQR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;

    const result = await generateVerificationQR(
      Array.isArray(documentId) ? documentId[0] : documentId
    );

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Download QR code as PNG
 */
export const downloadQR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;

    const { buffer, filename } = await downloadQRCode(
      Array.isArray(documentId) ? documentId[0] : documentId
    );

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
