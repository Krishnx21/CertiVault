import { Document, Summary, Activity, Notification, SharedDocument, SharedMember, AccessLog, DownloadStats, Permission } from "./types.js";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const authHeader = getAuthHeader();
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...authHeader,
      ...(options?.headers || {}),
    },
  });
  
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body.error?.message || "Request failed");
  }
  if (response.status === 204) {
    return null as unknown as T;
  }
  return response.json() as Promise<T>;
};

export const api = {
  // Documents
  getDocuments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
    owner?: string;
  }): Promise<{ 
    documents: Document[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.isFavorite !== undefined) queryParams.append("isFavorite", params.isFavorite.toString());
    if (params?.isArchived !== undefined) queryParams.append("isArchived", params.isArchived.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.owner) queryParams.append("owner", params.owner);
    
    return request<{ 
      documents: Document[]; 
      total: number; 
      page: number; 
      limit: number; 
      totalPages: number; 
    }>(`/api/documents?${queryParams.toString()}`);
  },

  getDocument: (id: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}`),

  uploadDocument: (formData: FormData): Promise<{ data: Document }> =>
    request<{ data: Document }>("/api/documents", { method: "POST", body: formData }),

  updateDocument: (id: string, data: Partial<Document>): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteDocument: (id: string): Promise<null> =>
    request<null>(`/api/documents/${id}`, { method: "DELETE" }),

  archiveDocument: (id: string, reason?: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/archive`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),

  restoreDocument: (id: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/restore`, { method: "POST" }),

  favoriteDocument: (id: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/favorite`, { method: "POST" }),

  unfavoriteDocument: (id: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/favorite`, { method: "DELETE" }),

  verifyDocumentStatus: (id: string, status: "verified" | "rejected", notes?: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    }),

  searchDocuments: (query: string, page = 1, limit = 20): Promise<{ 
    documents: Document[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> =>
    request<{ 
      documents: Document[]; 
      total: number; 
      page: number; 
      limit: number; 
      totalPages: number; 
    }>(`/api/documents/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  filterDocuments: (params: {
    category?: string;
    status?: string;
    verificationStatus?: string;
    fileType?: string;
    startDate?: string;
    endDate?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ 
    documents: Document[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append("category", params.category);
    if (params.status) queryParams.append("status", params.status);
    if (params.verificationStatus) queryParams.append("verificationStatus", params.verificationStatus);
    if (params.fileType) queryParams.append("fileType", params.fileType);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.isFavorite !== undefined) queryParams.append("isFavorite", params.isFavorite.toString());
    if (params.isArchived !== undefined) queryParams.append("isArchived", params.isArchived.toString());
    queryParams.append("page", (params.page || 1).toString());
    queryParams.append("limit", (params.limit || 20).toString());
    
    return request<{ 
      documents: Document[]; 
      total: number; 
      page: number; 
      limit: number; 
      totalPages: number; 
    }>(`/api/documents/filter?${queryParams.toString()}`);
  },

  getRecentDocuments: (limit = 10): Promise<{ data: Document[] }> =>
    request<{ data: Document[] }>(`/api/documents/recent?limit=${limit}`),

  getFavoriteDocuments: (page = 1, limit = 20): Promise<{ 
    documents: Document[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> =>
    request<{ 
      documents: Document[]; 
      total: number; 
      page: number; 
      limit: number; 
      totalPages: number; 
    }>(`/api/documents/favorites?page=${page}&limit=${limit}`),

  getDocumentDownloadUrl: async (id: string, filename?: string): Promise<{ url: string; filename: string }> => {
    const response = await request<{ data: { url: string } }>(`/api/documents/${id}/download`);
    return { url: response.data.url, filename: filename || `document-${id}` };
  },

  downloadDocument: async (id: string, filename?: string): Promise<void> => {
    // Call the download endpoint directly with auth headers — the backend will either
    // stream the file (local storage) or return a JSON { data: { url } } (S3).
    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error((body as any).error?.message || "Download failed");
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      // S3 path — backend returned a presigned URL, open it directly
      const data = (await response.json()) as { data: { url: string } };
      const a = document.createElement("a");
      a.href = data.data.url;
      a.download = filename || `document-${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Local storage path — backend streamed the file bytes
    const disposition = response.headers.get("Content-Disposition") || "";
    const nameMatch = disposition.match(/filename="([^"]+)"/);
    const resolvedFilename = filename || (nameMatch ? decodeURIComponent(nameMatch[1]) : `document-${id}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = resolvedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  getDocumentSummary: (): Promise<{ data: Summary }> =>
    request<{ data: Summary }>("/api/documents/summary"),

  getActivityTimeline: (limit = 20): Promise<{ data: Activity[] }> =>
    request<{ data: Activity[] }>(`/api/documents/activity?limit=${limit}`),

  getDocumentNotifications: (limit = 10): Promise<{ data: Notification[] }> =>
    request<{ data: Notification[] }>(`/api/documents/notifications?limit=${limit}`),

  // Verifications
  verifyDocument: (documentId: string, status: "verified" | "rejected", method = "manual", notes?: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/documents/${documentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, method, notes }),
    }),

  reverifyDocument: (documentId: string, method = "manual", notes?: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/documents/${documentId}/reverify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, notes }),
    }),

  getVerification: (documentId: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/documents/${documentId}`),

  getVerificationHistory: (documentId: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/documents/${documentId}/history`),

  publicVerify: (token: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/public/${token}`),

  verifyHash: (documentHash: string, checksum?: string): Promise<{ data: any }> =>
    request<{ data: any }>("/api/verifications/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentHash, checksum }),
    }),

  compareHash: (originalHash: string, newHash: string): Promise<{ data: any }> =>
    request<{ data: any }>("/api/verifications/hash/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalHash, newHash }),
    }),

  revokeVerification: (verificationId: string, reason: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/${verificationId}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),

  getVerifications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    search?: string;
  }): Promise<{
    verifications: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.method) queryParams.append("method", params.method);
    if (params?.search) queryParams.append("search", params.search);

    return request<{
      verifications: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/verifications?${queryParams.toString()}`);
  },

  searchVerifications: (query: string, page = 1, limit = 20): Promise<{
    verifications: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> =>
    request<{
      verifications: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/verifications/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  filterVerifications: (params: {
    status?: string;
    method?: string;
    documentId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    verifications: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.method) queryParams.append("method", params.method);
    if (params.documentId) queryParams.append("documentId", params.documentId);
    if (params.userId) queryParams.append("userId", params.userId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    queryParams.append("page", (params.page || 1).toString());
    queryParams.append("limit", (params.limit || 20).toString());

    return request<{
      verifications: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/verifications/filter?${queryParams.toString()}`);
  },

  getVerificationStatistics: (): Promise<{ data: any }> =>
    request<{ data: any }>("/api/verifications/statistics"),

  generateVerificationQR: (documentId: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/verifications/documents/${documentId}/qr`, { method: "POST" }),

  downloadVerificationQR: (documentId: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/api/verifications/documents/${documentId}/qr/download`, {
      headers: getAuthHeader(),
    }).then((response) => response.blob()),

  // Shares
  createShare: (data: {
    documentId: string;
    password?: string;
    expiresAt?: string;
    maxAccessCount?: number;
  }): Promise<{ data: SharedDocument }> =>
    request<{ data: SharedDocument }>("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getShareByToken: (token: string): Promise<{ data: SharedDocument }> =>
    request<{ data: SharedDocument }>(`/api/shares/public/${token}`),

  accessShare: (token: string, password?: string): Promise<{ data: any }> =>
    request<{ data: any }>(`/api/shares/public/${token}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),

  revokeShare: (shareId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/shares/${shareId}`, { method: "DELETE" }),

  getUserShares: (page = 1, limit = 20): Promise<{
    data: {
      shares: SharedDocument[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> =>
    request<{
      data: {
        shares: SharedDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/shares?page=${page}&limit=${limit}`),

  getShareById: (shareId: string): Promise<{ data: SharedDocument }> =>
    request<{ data: SharedDocument }>(`/api/shares/${shareId}`),

  updateShare: (shareId: string, data: {
    expiresAt?: string;
    maxAccessCount?: number;
    password?: string;
  }): Promise<{ data: SharedDocument }> =>
    request<{ data: SharedDocument }>(`/api/shares/${shareId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Members
  inviteMember: (data: {
    documentId: string;
    memberEmail: string;
    memberName?: string;
    permission: Permission;
    expiresAt?: string;
  }): Promise<{ data: SharedMember }> =>
    request<{ data: SharedMember }>("/api/shares/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  acceptInvite: (token: string): Promise<{ data: SharedMember }> =>
    request<{ data: SharedMember }>(`/api/shares/members/accept/${token}`, { method: "POST" }),

  declineInvite: (token: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/shares/members/decline/${token}`, { method: "POST" }),

  revokeMember: (memberId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/shares/members/${memberId}`, { method: "DELETE" }),

  updateMemberPermission: (memberId: string, permission: Permission): Promise<{ data: SharedMember }> =>
    request<{ data: SharedMember }>(`/api/shares/members/${memberId}/permission`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission }),
    }),

  getDocumentMembers: (documentId: string): Promise<{ data: SharedMember[] }> =>
    request<{ data: SharedMember[] }>(`/api/shares/documents/${documentId}/members`),

  getUserInvitations: (): Promise<{ data: SharedMember[] }> =>
    request<{ data: SharedMember[] }>("/api/shares/members/invitations"),

  getSharedWithMe: (page = 1, limit = 20): Promise<{
    data: {
      members: SharedMember[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> =>
    request<{
      data: {
        members: SharedMember[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/shares/shared-with-me?page=${page}&limit=${limit}`),

  // Access Logs
  getDocumentAccessLogs: (documentId: string, page = 1, limit = 50): Promise<{
    data: {
      logs: AccessLog[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> =>
    request<{
      data: {
        logs: AccessLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/shares/logs/documents/${documentId}?page=${page}&limit=${limit}`),

  getSharedDocumentAccessLogs: (sharedDocumentId: string, page = 1, limit = 50): Promise<{
    data: {
      logs: AccessLog[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> =>
    request<{
      data: {
        logs: AccessLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/shares/logs/shared/${sharedDocumentId}?page=${page}&limit=${limit}`),

  getUserAccessLogs: (page = 1, limit = 50): Promise<{
    data: {
      logs: AccessLog[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> =>
    request<{
      data: {
        logs: AccessLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/shares/logs/user?page=${page}&limit=${limit}`),

  getDocumentDownloadStats: (documentId: string): Promise<{ data: DownloadStats }> =>
    request<{ data: DownloadStats }>(`/api/shares/logs/documents/${documentId}/downloads`),

  getDocumentShareHistory: (documentId: string): Promise<{ data: AccessLog[] }> =>
    request<{ data: AccessLog[] }>(`/api/shares/logs/documents/${documentId}/history`),

  // Settings
  getProfile: (): Promise<{ data: any }> =>
    request<{ data: any }>("/api/settings/profile"),

  updateProfile: (data: {
    name?: string;
    bio?: string;
    avatar?: string;
  }): Promise<{ data: any }> =>
    request<{ data: any }>("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  updateEmail: (data: {
    newEmail: string;
    password: string;
  }): Promise<{ success: boolean; message: string; email: string }> =>
    request<{ success: boolean; message: string; email: string }>("/api/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  updateNotificationPreferences: (preferences: {
    emailNotifications?: boolean;
    documentShared?: boolean;
    documentVerified?: boolean;
    expiryReminders?: boolean;
    teamUpdates?: boolean;
  }): Promise<{ data: any }> =>
    request<{ data: any }>("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    }),

  deleteAccount: (data: {
    password: string;
    confirmation: string;
  }): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>("/api/settings/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  generateAvatar: (name: string): Promise<{ data: { avatarUrl: string } }> =>
    request<{ data: { avatarUrl: string } }>(`/api/settings/avatar?name=${encodeURIComponent(name)}`),

  getSessions: (): Promise<{ data: any[] }> =>
    request<{ data: any[] }>("/api/settings/sessions"),

  revokeAllSessions: (currentSessionId?: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>("/api/settings/sessions/revoke-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSessionId }),
    }),

  revokeSession: (sessionId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/settings/sessions/${sessionId}`, { method: "DELETE" }),

  // Notifications
  getNotifications: (page?: number, limit?: number, unreadOnly?: boolean): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> =>
    request<{
      notifications: Notification[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/notifications?page=${page || 1}&limit=${limit || 20}${unreadOnly ? '&unreadOnly=true' : ''}`),

  getUnreadCount: (): Promise<{ count: number }> =>
    request<{ count: number }>("/api/notifications/unread-count"),

  markAsRead: (notificationId: string): Promise<{ success: boolean; notification: Notification; message: string }> =>
    request<{ success: boolean; notification: Notification; message: string }>(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    }),

  markAllAsRead: (): Promise<{ success: boolean; modifiedCount: number; message: string }> =>
    request<{ success: boolean; modifiedCount: number; message: string }>("/api/notifications/read-all", {
      method: "PUT",
    }),

  deleteNotification: (notificationId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/notifications/${notificationId}`, { method: "DELETE" }),

  deleteReadNotifications: (): Promise<{ success: boolean; deletedCount: number; message: string }> =>
    request<{ success: boolean; deletedCount: number; message: string }>("/api/notifications/read", { method: "DELETE" }),

  deleteAllNotifications: (): Promise<{ success: boolean; deletedCount: number; message: string }> =>
    request<{ success: boolean; deletedCount: number; message: string }>("/api/notifications", { method: "DELETE" }),

  // Search
  globalSearch: (query: string, filters?: {
    category?: string;
    status?: string;
    verificationStatus?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    tags?: string[];
    includeShared?: boolean;
  }, page?: number, limit?: number): Promise<{
    documents: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.verificationStatus) params.append("verificationStatus", filters.verificationStatus);
      if (filters.isArchived !== undefined) params.append("isArchived", String(filters.isArchived));
      if (filters.isFavorite !== undefined) params.append("isFavorite", String(filters.isFavorite));
      if (filters.tags) filters.tags.forEach(tag => params.append("tags", tag));
      if (filters.includeShared !== undefined) params.append("includeShared", String(filters.includeShared));
    }
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    return request<{
      documents: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/search?${params.toString()}`);
  },

  getSearchSuggestions: (query: string): Promise<string[]> =>
    request<string[]>(`/api/search/suggestions?q=${encodeURIComponent(query)}`),

  getRecentSearches: (): Promise<string[]> =>
    request<string[]>("/api/search/recent"),

  // ─── Vault Members ──────────────────────────────────────────────────────────

  // Owner: invite a member
  inviteVaultMember: (data: { memberEmail: string; role: "viewer" | "editor" }): Promise<{ success: boolean; data: import("./types.js").VaultMember }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember }>("/api/vault/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Owner: list members grouped by status
  listVaultMembers: (): Promise<{ success: boolean; data: import("./types.js").VaultMemberList }> =>
    request<{ success: boolean; data: import("./types.js").VaultMemberList }>("/api/vault/members"),

  // Owner: change member role
  changeVaultMemberRole: (memberId: string, role: "viewer" | "editor"): Promise<{ success: boolean; data: import("./types.js").VaultMember }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember }>(`/api/vault/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }),

  // Owner: remove a member
  removeVaultMember: (memberId: string): Promise<null> =>
    request<null>(`/api/vault/members/${memberId}`, { method: "DELETE" }),

  // Owner: resend pending invite
  resendVaultInvite: (memberId: string): Promise<{ success: boolean; data: import("./types.js").VaultMember }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember }>(`/api/vault/members/${memberId}/resend`, { method: "POST" }),

  // Member: get pending invites sent to my email
  getMyVaultInvites: (): Promise<{ success: boolean; data: import("./types.js").VaultMember[] }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember[] }>("/api/vault/invites"),

  // Member: accept an invite by token
  acceptVaultInvite: (token: string): Promise<{ success: boolean; data: import("./types.js").VaultMember }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember }>(`/api/vault/invites/${token}/accept`, { method: "POST" }),

  // Member: decline an invite by token
  declineVaultInvite: (token: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`/api/vault/invites/${token}/decline`, { method: "POST" }),

  // Member: leave a vault
  leaveVault: (vaultOwnerId: string): Promise<null> =>
    request<null>(`/api/vault/access/${vaultOwnerId}`, { method: "DELETE" }),

  // Member: list all vaults shared with me
  getSharedVaults: (): Promise<{ success: boolean; data: import("./types.js").VaultMember[] }> =>
    request<{ success: boolean; data: import("./types.js").VaultMember[] }>("/api/vault/shared-with-me"),

  // Get documents from a specific vault (pass vaultOwnerId as query param)
  getVaultDocuments: (vaultOwnerId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    sortBy?: string;
  }): Promise<{
    documents: import("./types.js").Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const q = new URLSearchParams({ vaultOwnerId });
    if (params?.page)     q.append("page",     params.page.toString());
    if (params?.limit)    q.append("limit",    params.limit.toString());
    if (params?.search)   q.append("search",   params.search);
    if (params?.status)   q.append("status",   params.status);
    if (params?.category) q.append("category", params.category);
    if (params?.sortBy)   q.append("sortBy",   params.sortBy);
    return request<{
      documents: import("./types.js").Document[];
      total: number; page: number; limit: number; totalPages: number;
    }>(`/api/documents?${q.toString()}`);
  },
};
