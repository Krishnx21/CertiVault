import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive, ArchiveRestore, CheckCircle2, Files,
  Filter, Grid3x3, List, ShieldCheck, Upload, X, Star,
} from "lucide-react";
import { api } from "../api.js";
import { Document, Summary } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { UploadModal } from "../components/UploadModal.js";
import { DocumentPreviewModal } from "../components/DocumentPreviewModal.js";
import ShareModal from "../components/ShareModal.js";
import { DocumentCardSkeleton, TableSkeleton } from "../components/SkeletonLoader.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
};

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [isArchived, setIsArchived] = useState<boolean | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [owner, setOwner] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
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
      const [docRes, sumRes] = await Promise.all([
        api.getDocuments({ search, status, category, isFavorite, isArchived, sortBy, startDate, endDate, owner, page, limit: 24 }),
        api.getDocumentSummary(),
      ]);
      setDocuments(docRes.documents);
      setSummary(sumRes.data);
      setFilteredTotal(docRes.total);
      setTotalPages(docRes.totalPages);
    } catch (err: any) {
      setToast(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [search, status, category, isFavorite, isArchived, sortBy, startDate, endDate, owner, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshAfterUpload = async () => { setUploadOpen(false); setToast("Document uploaded."); await load(); };
  const remove = async (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try { await api.deleteDocument(id); setToast("Document deleted."); await load(); } catch (err: any) { setToast(err.message || "Delete failed"); }
  };
  const archive = async (id: string) => {
    try { await api.archiveDocument(id); setToast("Document archived."); await load(); } catch (err: any) { setToast(err.message || "Archive failed"); }
  };
  const restore = async (id: string) => {
    try { await api.restoreDocument(id); setToast("Document restored."); await load(); } catch (err: any) { setToast(err.message || "Restore failed"); }
  };
  const toggleFavorite = async (id: string, cur: boolean) => {
    setDocuments(d => d.map(doc => doc._id === id ? { ...doc, isFavorite: !cur } : doc));
    try {
      if (cur) await api.unfavoriteDocument(id); else await api.favoriteDocument(id);
      setToast(cur ? "Removed from favorites" : "Added to favorites");
    } catch (err: any) {
      setDocuments(d => d.map(doc => doc._id === id ? { ...doc, isFavorite: cur } : doc));
      setToast(err.message || "Update failed");
    }
  };
  const download = async (id: string) => {
    try { await api.downloadDocument(id); setToast("Download started."); } catch (err: any) { setToast(err.message || "Download failed"); }
  };
  const clearFilters = () => { setStatus("all"); setCategory("all"); setIsFavorite(undefined); setIsArchived(undefined); setStartDate(""); setEndDate(""); setOwner("all"); setSearch(""); setPage(1); };
  const hasActiveFilters = status !== "all" || category !== "all" || isFavorite !== undefined || isArchived !== undefined || search !== "" || startDate !== "" || endDate !== "" || owner !== "all";

  const DocIcon = ({ doc, size = 48 }: { doc: Document; size?: number }) => (
    doc.thumbnailUrl
      ? <img src={doc.thumbnailUrl} alt="" style={{ width: size, height: size, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      : <div style={{ width: size, height: size, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-violet))", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0, fontFamily: "'Manrope', sans-serif" }}>
          {doc.fileName.charAt(0).toUpperCase()}
        </div>
  );

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main>
        <Topbar search={search} setSearch={setSearch} setMobileNav={setMobileNav} />
        <div className="content">

          {/* Hero */}
          <section className="hero-row">
            <div>
              <p className="eyebrow">Documents</p>
              <h1>My Documents</h1>
              <p>Manage and organize your secure documents.</p>
            </div>
            <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
              <button className="button secondary" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} aria-hidden="true" />
                Filters
                {hasActiveFilters && <span className="filter-active-chip">Active</span>}
              </button>
              <button className="button primary upload-button" onClick={() => setUploadOpen(true)}>
                <Upload size={16} aria-hidden="true" /> Upload
              </button>
            </div>
          </section>

          {/* Filters */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-grid">
                <div className="filter-field">
                  <label htmlFor="f-status">Status</label>
                  <select id="f-status" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="f-category">Category</label>
                  <select id="f-category" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="all">All categories</option>
                    <option value="certificate">Certificate</option>
                    <option value="contract">Contract</option>
                    <option value="identity">Identity</option>
                    <option value="invoice">Invoice</option>
                    <option value="report">Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="f-fav">Favorites</label>
                  <select id="f-fav" value={isFavorite === undefined ? "all" : String(isFavorite)} onChange={e => setIsFavorite(e.target.value === "all" ? undefined : e.target.value === "true")}>
                    <option value="all">All documents</option>
                    <option value="true">Favorites only</option>
                    <option value="false">Non-favorites</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="f-archived">Archived</label>
                  <select id="f-archived" value={isArchived === undefined ? "all" : String(isArchived)} onChange={e => setIsArchived(e.target.value === "all" ? undefined : e.target.value === "true")}>
                    <option value="all">All documents</option>
                    <option value="false">Active only</option>
                    <option value="true">Archived only</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="f-sort">Sort by</label>
                  <select id="f-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title_asc">Title A–Z</option>
                    <option value="title_desc">Title Z–A</option>
                    <option value="size_asc">Smallest first</option>
                    <option value="size_desc">Largest first</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="f-from">From date</label>
                  <input id="f-from" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="filter-field">
                  <label htmlFor="f-to">To date</label>
                  <input id="f-to" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="filter-field">
                  <label htmlFor="f-owner">Owner</label>
                  <select id="f-owner" value={owner} onChange={e => setOwner(e.target.value)}>
                    <option value="all">All owners</option>
                    <option value="me">Mine only</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="filter-field" style={{ justifyContent: "flex-end" }}>
                    <button className="button ghost" onClick={clearFilters} style={{ alignSelf: "flex-end" }}>
                      <X size={15} aria-hidden="true" /> Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              {loading ? "Loading…" : `${documents.length} of ${filteredTotal} document${filteredTotal !== 1 ? "s" : ""}`}
            </p>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                className={`icon-button${viewMode === "grid" ? " view-btn-active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view" aria-pressed={viewMode === "grid"}
                style={{ width: 34, height: 34 }}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                className={`icon-button${viewMode === "list" ? " view-btn-active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view" aria-pressed={viewMode === "list"}
                style={{ width: 34, height: 34 }}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
                {Array.from({ length: 8 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="table-container">
                <table><thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr></thead>
                <tbody><TableSkeleton rows={8} /></tbody></table>
              </div>
            )
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <Files size={56} />
              {hasActiveFilters ? (
                <><h3>No results for these filters</h3><p>Try adjusting or clearing your filters.</p>
                  <button className="button primary" onClick={clearFilters}><X size={16} /> Clear filters</button></>
              ) : (
                <><h3>No documents yet</h3><p>Upload your first document to get started.</p>
                  <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload document</button></>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {documents.map(doc => (
                <div key={doc._id} className="document-card" onClick={() => { setPreviewDocument(doc); setPreviewOpen(true); }}
                  role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && (() => { setPreviewDocument(doc); setPreviewOpen(true); })()}
                  aria-label={`Open ${doc.title}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <DocIcon doc={doc} size={44} />
                    <button
                      className="icon-button" style={{ width: 30, height: 30 }}
                      onClick={e => { e.stopPropagation(); toggleFavorite(doc._id, doc.isFavorite); }}
                      aria-label={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star size={15} color={doc.isFavorite ? "var(--accent-amber)" : "var(--text-muted)"} fill={doc.isFavorite ? "var(--accent-amber)" : "none"} />
                    </button>
                  </div>
                  <h3 className="truncate" style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.2rem" }}>{doc.title}</h3>
                  <p className="truncate" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{doc.fileName}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatBytes(doc.fileSize)}</span>
                    <span className={`badge ${doc.status === "verified" ? "green" : doc.status === "rejected" ? "red" : "amber"}`}>{doc.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", flexWrap: "wrap" }}>
                    <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", minWidth: 0 }} onClick={e => { e.stopPropagation(); download(doc._id); }}>Download</button>
                    <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", minWidth: 0 }} onClick={e => { e.stopPropagation(); navigate(`/verification/${doc._id}`); }}>Verify</button>
                    <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", minWidth: 0 }} onClick={e => { e.stopPropagation(); setShareDocument(doc); setShareOpen(true); }}>Share</button>
                    {doc.isArchived
                      ? <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", color: "var(--accent-green)", minWidth: 0 }} onClick={e => { e.stopPropagation(); restore(doc._id); }}><ArchiveRestore size={13} />Restore</button>
                      : <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", color: "var(--accent-amber)", minWidth: 0 }} onClick={e => { e.stopPropagation(); archive(doc._id); }}><Archive size={13} />Archive</button>
                    }
                    <button className="button ghost" style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.8rem", color: "var(--accent-red)", minWidth: 0 }} onClick={e => { e.stopPropagation(); remove(doc._id); }}><X size={13} />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr></thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <DocIcon doc={doc} size={36} />
                          <div style={{ minWidth: 0 }}>
                            <div className="truncate" style={{ fontWeight: 500, color: "var(--text-primary)", maxWidth: 220 }}>{doc.title}</div>
                            <div className="truncate" style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: 220 }}>{doc.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{doc.category}</td>
                      <td>{formatBytes(doc.fileSize)}</td>
                      <td><span className={`badge ${doc.status === "verified" ? "green" : doc.status === "rejected" ? "red" : "amber"}`}>{doc.status}</span></td>
                      <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button className="icon-button" style={{ width: 32, height: 32 }} onClick={() => download(doc._id)} title="Download"><Files size={15} /></button>
                          <button className="icon-button" style={{ width: 32, height: 32 }} onClick={() => toggleFavorite(doc._id, doc.isFavorite)} title={doc.isFavorite ? "Unfavorite" : "Favorite"}>
                            <Star size={15} color={doc.isFavorite ? "var(--accent-amber)" : undefined} fill={doc.isFavorite ? "var(--accent-amber)" : "none"} />
                          </button>
                          <button className="icon-button" style={{ width: 32, height: 32 }} onClick={() => navigate(`/verification/${doc._id}`)} title="Verification"><ShieldCheck size={15} /></button>
                          {doc.isArchived
                            ? <button className="icon-button" style={{ width: 32, height: 32, color: "var(--accent-green)" }} onClick={() => restore(doc._id)} title="Restore"><ArchiveRestore size={15} /></button>
                            : <button className="icon-button" style={{ width: 32, height: 32, color: "var(--accent-amber)" }} onClick={() => archive(doc._id)} title="Archive"><Archive size={15} /></button>
                          }
                          <button className="icon-button" style={{ width: 32, height: 32, color: "var(--accent-red)" }} onClick={() => remove(doc._id)} title="Delete"><X size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="button ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`button ${page === p ? "primary" : "ghost"}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="button ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </div>
      </main>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refreshAfterUpload} />}
      {previewOpen && previewDocument && <DocumentPreviewModal document={previewDocument} onClose={() => setPreviewOpen(false)} onToggleFavorite={toggleFavorite} />}
      {shareOpen && shareDocument && <ShareModal documentId={shareDocument._id} documentTitle={shareDocument.title} onClose={() => setShareOpen(false)} />}
      {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={15} aria-hidden="true" />{toast}</div>}
    </div>
  );
}
