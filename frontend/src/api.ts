import { Document, Summary } from "./types.js";

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

  getDocumentDownloadUrl: (id: string): Promise<{ data: { url: string } }> =>
    request<{ data: { url: string } }>(`/api/documents/${id}/download`),

  getDocumentSummary: (): Promise<{ data: Summary }> =>
    request<{ data: Summary }>("/api/documents/summary"),

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
};
