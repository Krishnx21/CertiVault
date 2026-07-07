const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (path, options) => {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
};

export const api = {
  getDocuments: (search = "", status = "all") => request(`/api/documents?search=${encodeURIComponent(search)}&status=${status}`),
  getSummary: () => request("/api/dashboard/summary"),
  uploadDocument: (formData) => request("/api/documents", { method: "POST", body: formData }),
  verifyDocument: (id) => request(`/api/documents/${id}/verify`, { method: "PATCH" }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
};
