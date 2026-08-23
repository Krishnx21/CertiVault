/**
 * Shares service — single-document, view-only share links (password-on-link).
 *
 * The owner creates a link for ONE document. The recipient opens it, enters the
 * password the owner shared out-of-band, and receives a short-lived scoped view
 * token that unlocks ONLY that document's bytes — streamed inline, never as a
 * downloadable URL, and without touching the document's downloadCount.
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { createModuleLogger } from "../../common/utils/logger.js";
import { DocumentModel } from "../documents/document.model.js";
import { getObjectBuffer, StorageProvider } from "../documents/s3.service.js";
import { queueDocumentShareLink } from "../../queues/index.js";
import { signShareViewToken, verifyShareViewToken } from "./share.token.js";
import { SharedDocumentModel, ISharedDocument } from "./sharedDocument.model.js";
import type { CreateShareInput } from "./share.validation.js";

const log = createModuleLogger("shares");
const env = getEnv();

/** Opaque, unguessable share token — same pattern as vault invite tokens. */
function makeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function buildShareUrl(shareToken: string): string {
  return `${env.FRONTEND_ORIGIN}/shared/${shareToken}`;
}

/**
 * Serialize a share for the OWNER. Includes the token + URL (the owner needs
 * them to share), but NEVER the passwordHash. `hasPassword` is exposed instead.
 */
function serializeForOwner(share: ISharedDocument) {
  return {
    _id: share._id.toString(),
    documentId: share.documentId.toString(),
    documentTitle: share.documentTitle,
    documentFileName: share.documentFileName,
    owner: share.owner.toString(),
    ownerName: share.ownerName,
    ownerEmail: share.ownerEmail,
    shareToken: share.shareToken,
    shareUrl: buildShareUrl(share.shareToken),
    recipientEmail: share.recipientEmail ?? undefined,
    hasPassword: !!share.passwordHash,
    expiresAt: share.expiresAt ? share.expiresAt.toISOString() : undefined,
    maxAccessCount: share.maxAccessCount ?? undefined,
    currentAccessCount: share.currentAccessCount,
    isActive: share.isActive,
    createdAt: share.createdAt.toISOString(),
    updatedAt: share.updatedAt.toISOString(),
  };
}

export async function createShare(
  ownerId: string,
  ownerName: string | undefined,
  ownerEmail: string | undefined,
  input: CreateShareInput
) {
  if (!mongoose.isValidObjectId(input.documentId)) {
    throw new ApiError(400, "INVALID_DOCUMENT_ID", "Invalid document id");
  }

  // Owner-scoped: you can only share a document you own.
  const doc = await DocumentModel.findOne({ _id: input.documentId, owner: ownerId });
  if (!doc) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  let expiresAt: Date | null = null;
  if (input.expiresAt) {
    const d = new Date(input.expiresAt);
    if (Number.isNaN(d.getTime())) {
      throw new ApiError(400, "INVALID_EXPIRY", "Invalid expiration date");
    }
    if (d.getTime() <= Date.now()) {
      throw new ApiError(400, "INVALID_EXPIRY", "Expiration date must be in the future");
    }
    expiresAt = d;
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
    : null;

  const shareToken = makeToken();

  const share = await SharedDocumentModel.create({
    documentId: doc._id,
    documentTitle: doc.title,
    documentFileName: doc.fileName || doc.metadata?.originalName || doc.title,
    storageKey: doc.storageKey,
    storageProvider: (doc.storageProvider as "s3" | "local") || "local",
    mimeType: doc.mimeType,
    owner: new mongoose.Types.ObjectId(ownerId),
    ownerName: ownerName || doc.ownerName,
    ownerEmail: ownerEmail || doc.ownerEmail,
    shareToken,
    passwordHash,
    recipientEmail: input.recipientEmail ?? null,
    expiresAt,
    maxAccessCount: input.maxAccessCount ?? null,
    currentAccessCount: 0,
    lastAccessedAt: null,
    isActive: true,
  });

  const shareUrl = buildShareUrl(shareToken);

  // Optionally email the link to the recipient. The password is intentionally
  // NOT included — the owner shares it out-of-band (email worker enforces this).
  if (input.recipientEmail) {
    try {
      await queueDocumentShareLink({
        email: input.recipientEmail,
        ownerName: ownerName || doc.ownerName,
        documentTitle: doc.title,
        shareUrl,
        hasPassword: !!passwordHash,
        message: input.message,
      });
    } catch (err) {
      // Never fail share creation just because the email couldn't be queued.
      log.warn("Failed to queue share-link email", { error: (err as Error).message });
    }
  }

  log.info("Share link created", {
    shareId: share._id.toString(),
    documentId: doc._id.toString(),
    owner: ownerId,
    hasPassword: !!passwordHash,
    recipientEmail: input.recipientEmail ?? null,
  });

  return serializeForOwner(share);
}

export async function listUserShares(ownerId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [shares, total] = await Promise.all([
    SharedDocumentModel.find({ owner: ownerId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SharedDocumentModel.countDocuments({ owner: ownerId, isActive: true }),
  ]);

  return {
    shares: shares.map(serializeForOwner),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function revokeShare(ownerId: string, shareId: string): Promise<void> {
  if (!mongoose.isValidObjectId(shareId)) {
    throw new ApiError(400, "INVALID_SHARE_ID", "Invalid share id");
  }
  // Owner-scoped: a user can only revoke their own shares.
  const share = await SharedDocumentModel.findOne({ _id: shareId, owner: ownerId });
  if (!share) {
    throw new ApiError(404, "SHARE_NOT_FOUND", "Share not found");
  }
  share.isActive = false;
  await share.save();
  log.info("Share link revoked", { shareId, owner: ownerId });
}

// ── Public (recipient) operations ─────────────────────────────────────────────

/**
 * Public metadata for the share landing page. Returns ONLY what the viewer needs
 * to render the password prompt — never file bytes, token, or passwordHash.
 */
export async function getPublicShare(token: string) {
  const share = await SharedDocumentModel.findOne({ shareToken: token });
  if (!share || !share.isActive) {
    throw new ApiError(404, "SHARE_NOT_FOUND", "This share link is no longer available");
  }
  if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "SHARE_EXPIRED", "This share link has expired");
  }
  if (share.maxAccessCount != null && share.currentAccessCount >= share.maxAccessCount) {
    throw new ApiError(410, "SHARE_LIMIT_REACHED", "This share link has reached its access limit");
  }

  return {
    documentTitle: share.documentTitle,
    documentFileName: share.documentFileName,
    mimeType: share.mimeType,
    ownerName: share.ownerName,
    requiresPassword: !!share.passwordHash,
    expiresAt: share.expiresAt ? share.expiresAt.toISOString() : undefined,
  };
}

/**
 * Validate the link + password, count the access, and mint a short-lived view
 * token. This is the only step that increments currentAccessCount.
 */
export async function accessShare(
  token: string,
  password: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined
) {
  const share = await SharedDocumentModel.findOne({ shareToken: token });
  if (!share || !share.isActive) {
    throw new ApiError(404, "SHARE_NOT_FOUND", "This share link is no longer available");
  }
  if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "SHARE_EXPIRED", "This share link has expired");
  }
  if (share.maxAccessCount != null && share.currentAccessCount >= share.maxAccessCount) {
    throw new ApiError(410, "SHARE_LIMIT_REACHED", "This share link has reached its access limit");
  }

  if (share.passwordHash) {
    if (!password) {
      throw new ApiError(401, "PASSWORD_REQUIRED", "Password is required");
    }
    const ok = await bcrypt.compare(password, share.passwordHash);
    if (!ok) {
      throw new ApiError(401, "INCORRECT_PASSWORD", "Incorrect password");
    }
  }

  share.currentAccessCount += 1;
  share.lastAccessedAt = new Date();
  await share.save();

  // Audit: who/when. We log the access, not the password.
  log.info("Share accessed", {
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    ip: ip ?? null,
    userAgent: userAgent ?? null,
    accessCount: share.currentAccessCount,
  });

  const viewToken = signShareViewToken({
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
  });

  return {
    viewToken,
    document: {
      title: share.documentTitle,
      fileName: share.documentFileName,
      mimeType: share.mimeType,
    },
  };
}

/**
 * Return the raw bytes for inline rendering. Requires a valid view token bound
 * to THIS share/document. Re-checks active + expiry so a revoked/expired link
 * kills in-flight viewers. Does NOT increment access count or downloadCount.
 */
export async function getShareFile(token: string, viewToken: string) {
  let payload;
  try {
    payload = verifyShareViewToken(viewToken);
  } catch {
    throw new ApiError(
      401,
      "INVALID_VIEW_TOKEN",
      "Your view session is invalid or has expired. Please re-enter the password."
    );
  }

  const share = await SharedDocumentModel.findOne({ shareToken: token });
  if (!share || !share.isActive) {
    throw new ApiError(404, "SHARE_NOT_FOUND", "This share link is no longer available");
  }

  // A token minted for one share cannot be replayed against another.
  if (
    payload.shareId !== share._id.toString() ||
    payload.documentId !== share.documentId.toString()
  ) {
    throw new ApiError(403, "TOKEN_MISMATCH", "This view session does not match this document");
  }

  if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "SHARE_EXPIRED", "This share link has expired");
  }

  const provider = share.storageProvider === "s3" ? StorageProvider.S3 : StorageProvider.LOCAL;
  const buffer = await getObjectBuffer(share.storageKey, provider);

  return {
    buffer,
    mimeType: share.mimeType,
    fileName: share.documentFileName,
  };
}
