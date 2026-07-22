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

export interface AppNotification {
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

// Shared Vault Types
export type Permission = "viewer" | "editor" | "admin";

export type NotificationType =
  | "upload_completed"
  | "verification_completed"
  | "verification_rejected"
  | "share_accepted"
  | "share_revoked"
  | "new_member"
  | "storage_warning"
  | "document_shared"
  | "document_verified";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    documentId?: string;
    documentTitle?: string;
    documentFileName?: string;
    shareId?: string;
    memberId?: string;
    memberName?: string;
    memberEmail?: string;
    verificationId?: string;
    storageUsed?: number;
    storageLimit?: number;
    actionUrl?: string;
  };
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SharedDocument {
  _id: string;
  documentId: string;
  documentTitle: string;
  documentFileName: string;
  owner: string;
  ownerName: string;
  ownerEmail: string;
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
  maxAccessCount?: number;
  currentAccessCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedMember {
  _id: string;
  documentId: string;
  sharedDocumentId?: string;
  memberEmail: string;
  memberName?: string;
  memberUserId?: string;
  permission: Permission;
  invitedBy: string;
  invitedByName: string;
  invitedByEmail: string;
  inviteToken?: string;
  inviteStatus: "pending" | "accepted" | "declined" | "revoked";
  acceptedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccessAction = "view" | "download" | "share" | "revoke" | "invite" | "accept" | "decline";

export interface AccessLog {
  _id: string;
  documentId: string;
  documentTitle: string;
  sharedDocumentId?: string;
  sharedMemberId?: string;
  shareToken?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: AccessAction;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DownloadStats {
  totalDownloads: number;
  uniqueUsers: number;
  lastDownload?: string;
  downloads: Array<{
    date: string;
    userEmail: string;
    userName: string;
  }>;
}

// ─── Vault Member Types ───────────────────────────────────────────────────────

export type VaultRole = "viewer" | "editor";
export type VaultMemberStatus = "pending" | "active" | "revoked" | "declined";

export interface VaultMemberUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface VaultMember {
  _id: string;
  vaultOwnerId: string | VaultMemberUser;
  memberUserId: string | VaultMemberUser | null;
  memberEmail: string;
  role: VaultRole;
  status: VaultMemberStatus;
  inviteToken: string;
  inviteExpiresAt: string;
  invitedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  declinedAt: string | null;
  revokedBy: "owner" | "member" | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaultMemberList {
  active: VaultMember[];
  pending: VaultMember[];
  declined: VaultMember[];
}

