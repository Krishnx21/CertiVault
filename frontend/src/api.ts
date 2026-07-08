import { Document, Summary } from "./types.js";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, options);
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
  getDocuments: (search = "", status = "all"): Promise<{ data: Document[]; total: number }> =>
    request<{ data: Document[]; total: number }>(`/api/documents?search=${encodeURIComponent(search)}&status=${status}`),
  
  getSummary: (): Promise<{ data: Summary }> =>
    request<{ data: Summary }>("/api/dashboard/summary"),
  
  uploadDocument: (formData: FormData): Promise<{ data: Document }> =>
    request<{ data: Document }>("/api/documents", { method: "POST", body: formData }),
  
  verifyDocument: (id: string): Promise<{ data: Document }> =>
    request<{ data: Document }>(`/api/documents/${id}/verify`, { method: "PATCH" }),
  
  deleteDocument: (id: string): Promise<null> =>
    request<null>(`/api/documents/${id}`, { method: "DELETE" }),
};
