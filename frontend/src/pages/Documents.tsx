import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Files,
  Filter,
  Grid3x3,
  List,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { api } from "../api.js";
import { Document, Summary } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { UploadModal } from "../components/UploadModal.js";
import { DocumentPreviewModal } from "../components/DocumentPreviewModal.js";
import { DocumentCardSkeleton, TableSkeleton } from "../components/SkeletonLoader.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [documentResponse, summaryResponse] = await Promise.all([
        api.getDocuments({ search, status, category, isFavorite, sortBy, page, limit: 24 }),
        api.getDocumentSummary(),
      ]);
      setDocuments(documentResponse.documents);
      setSummary(summaryResponse.data);
      setTotalPages(documentResponse.totalPages);
    } catch (error: any) {
      console.error("Failed to load documents:", error);
      setToast(error.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [search, status, category, isFavorite, sortBy, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshAfterUpload = async () => {
    setUploadOpen(false);
    setToast("Document uploaded successfully.");
    await load();
  };


  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    try {
      await api.deleteDocument(id);
      setToast("Document deleted successfully.");
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to delete document");
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await api.unfavoriteDocument(id);
        setToast("Removed from favorites");
      } else {
        await api.favoriteDocument(id);
        setToast("Added to favorites");
      }
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to update favorite");
    }
  };



  const download = async (id: string) => {
    try {
      const { data } = await api.getDocumentDownloadUrl(id);
      window.open(data.url, "_blank");
      setToast("Download started.");
    } catch (error: any) {
      setToast(error.message || "Failed to download document");
    }
  };

  const viewPreview = (document: Document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  const viewVerification = (id: string) => {
    navigate(`/verification/${id}`);
  };

  const clearFilters = () => {
    setStatus("all");
    setCategory("all");
    setIsFavorite(undefined);
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = status !== "all" || category !== "all" || isFavorite !== undefined || search !== "";

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Close menu"
        />
      )}
      <main>
        <Topbar search={search} setSearch={setSearch} setMobileNav={setMobileNav} />
        <div className="content">
          <section className="hero-row">
            <div>
              <p className="eyebrow">DOCUMENTS</p>
              <h1>My Documents</h1>
              <p>Manage and organize your secure documents.</p>
            </div>
            <div className="flex gap-3">
              <button
                className="button secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} /> Filters {hasActiveFilters && <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">Active</span>}
              </button>
              <button
                className="button primary upload-button"
                onClick={() => setUploadOpen(true)}
              >
                <Upload size={18} /> Upload
              </button>
            </div>
          </section>

          {showFilters && (
            <div className="mb-6 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Categories</option>
                    <option value="certificate">Certificate</option>
                    <option value="contract">Contract</option>
                    <option value="identity">Identity</option>
                    <option value="invoice">Invoice</option>
                    <option value="report">Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Favorites</label>
                  <select
                    value={isFavorite === undefined ? "all" : isFavorite.toString()}
                    onChange={(e) => setIsFavorite(e.target.value === "all" ? undefined : e.target.value === "true")}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Documents</option>
                    <option value="true">Favorites Only</option>
                    <option value="false">Non-Favorites</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title_asc">Title (A-Z)</option>
                    <option value="title_desc">Title (Z-A)</option>
                    <option value="size_asc">Size (Smallest)</option>
                    <option value="size_desc">Size (Largest)</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    className="button ghost px-4 py-3"
                    onClick={clearFilters}
                  >
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-[var(--text-secondary)] text-sm">
              {documents.length} of {summary.total} documents
            </p>
            <div className="flex gap-2">
              <button
                className={`icon-button w-9 h-9 ${viewMode === "grid" ? "bg-[var(--bg-tertiary)]" : "bg-transparent"}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                className={`icon-button w-9 h-9 ${viewMode === "list" ? "bg-[var(--bg-tertiary)]" : "bg-transparent"}`}
                onClick={() => setViewMode("list")}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableSkeleton rows={8} />
                  </tbody>
                </table>
              </div>
            )
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <Files size={64} />
              <h3>No documents found</h3>
              <p>Upload your first document to get started.</p>
              <button className="button primary" onClick={() => setUploadOpen(true)}>
                <Upload size={18} /> Upload Document
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-blue-500"
                  onClick={() => viewPreview(doc)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      {doc.fileName.charAt(0).toUpperCase()}
                    </div>
                    <button
                      className="icon-button w-8 h-8"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(doc._id, doc.isFavorite); }}
                    >
                      {doc.isFavorite ? <span className="text-amber-500">★</span> : <span className="text-[var(--text-muted)]">☆</span>}
                    </button>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 truncate">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 truncate">
                    {doc.fileName}
                  </p>
                  <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span className={`badge ${doc.status === "verified" ? "green" : doc.status === "rejected" ? "red" : "amber"}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
                    <button
                      className="button ghost flex-1 py-2 text-sm"
                      onClick={(e) => { e.stopPropagation(); download(doc._id); }}
                    >
                      Download
                    </button>
                    <button
                      className="button ghost flex-1 py-2 text-sm"
                      onClick={(e) => { e.stopPropagation(); viewVerification(doc._id); }}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-base font-bold">
                            {doc.fileName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{doc.title}</div>
                            <div className="text-xs text-[var(--text-muted)]">{doc.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="capitalize">{doc.category}</td>
                      <td>{formatBytes(doc.fileSize)}</td>
                      <td>
                        <span className={`badge ${doc.status === "verified" ? "green" : doc.status === "rejected" ? "red" : "amber"}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="icon-button" onClick={() => download(doc._id)} title="Download">
                            <Files size={16} />
                          </button>
                          <button className="icon-button" onClick={() => toggleFavorite(doc._id, doc.isFavorite)} title={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                            {doc.isFavorite ? <span className="text-amber-500">★</span> : <span className="text-[var(--text-muted)]">☆</span>}
                          </button>
                          <button className="icon-button" onClick={() => viewVerification(doc._id)} title="Verification">
                            <ShieldCheck size={16} />
                          </button>
                          <button className="icon-button text-red-500" onClick={() => remove(doc._id)} title="Delete">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                className="button ghost px-4 py-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`button ${page === p ? "primary" : "ghost"} px-4 py-2 min-w-[40px]`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="button ghost px-4 py-2"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}

          {uploadOpen && (
            <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refreshAfterUpload} />
          )}

          {previewOpen && previewDocument && (
            <DocumentPreviewModal
              document={previewDocument}
              onClose={() => setPreviewOpen(false)}
            />
          )}

          {toast && (
            <div className="toast">
              <CheckCircle2 size={18} />
              {toast}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
