export interface Document {
  _id: string;
  title: string;
  description?: string;
  category: string;
  owner: string;
  ownerName: string;
  ownerEmail: string;
  tags: string[];
  status: "pending" | "verified" | "rejected";
  verificationStatus: "not_verified" | "verified" | "failed";
  storageUrl: string;
  storageKey: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  hash: string;
  isEncrypted: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  isFavorite: boolean;
  favoritedAt?: string;
  downloadCount: number;
  lastAccessedAt?: string;
  metadata: {
    originalName: string;
    extension: string;
    dimensions?: { width: number; height: number };
    pageCount?: number;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  archived: number;
  favorites: number;
  storageBytes: number;
}

export interface Activity {
  id: string;
  type: "upload" | "verify" | "favorite" | "archive" | "delete" | "share";
  documentId: string;
  documentTitle: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  documentId?: string;
  documentTitle?: string;
  timestamp: string;
  read: boolean;
}

export interface Verification {
  _id: string;
  documentId: string;
  documentTitle: string;
  documentHash: string;
  documentChecksum: string;
  verificationToken: string;
  verificationStatus: "verified" | "pending" | "rejected" | "expired" | "tampered" | "revoked";
  verificationMethod: "manual" | "qr" | "public" | "hash" | "api";
  verificationVersion: string;
  verifiedBy?: string;
  verifiedByUser?: string;
  verifiedAt?: string;
  lastVerificationDate?: string;
  verificationAttempts: number;
  qrCodeUrl?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  verificationHistory: Array<{
    status: string;
    method: string;
    verifiedAt: string;
    verifiedBy?: string;
    ipAddress?: string;
    userAgent?: string;
    result: "success" | "failure" | "mismatch";
    notes?: string;
  }>;
  metadata: {
    originalFileName: string;
    fileSize: number;
    fileType: string;
    issuer?: string;
    documentType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VerificationStatistics {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  expired: number;
  tampered: number;
  revoked: number;
}
