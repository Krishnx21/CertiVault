import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Hash,
  ShieldCheck,
  Star,
  Trash2,
  Archive,
  Calendar,
  HardDrive,
  Tag,
  User,
  Clock,
} from "lucide-react";
import { api } from "../api.js";
import { Document, Summary } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    loadDocument();
    loadSummary();
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDocument = async () => {
    if (!id) return;
    try {
      const { data } = await api.getDocument(id);
      setDocument(data);
    } catch (error: any) {
      console.error("Failed to load document:", error);
      setToast(error.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await api.getDocumentSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  const download = async () => {
    if (!document) return;
    try {
      await api.downloadDocument(document._id, document.fileName);
      setToast("Download started.");
    } catch (error: any) {
      setToast(error.message || "Failed to download document");
    }
  };

  const toggleFavorite = async () => {
    if (!document) return;
    
    // Optimistic update
    const originalIsFavorite = document.isFavorite;
    setDocument(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);

    try {
      if (document.isFavorite) {
        await api.unfavoriteDocument(document._id);
        setToast("Removed from favorites");
      } else {
        await api.favoriteDocument(document._id);
        setToast("Added to favorites");
      }
    } catch (error: any) {
      // Revert on error
      setDocument(prev => prev ? { ...prev, isFavorite: originalIsFavorite } : null);
      setToast(error.message || "Failed to update favorite");
    }
  };

  const archive = async () => {
    if (!document) return;
    if (!confirm("Are you sure you want to archive this document?")) return;
    try {
      await api.archiveDocument(document._id);
      setToast("Document archived successfully.");
      navigate("/documents");
    } catch (error: any) {
      setToast(error.message || "Failed to archive document");
    }
  };

  const remove = async () => {
    if (!document) return;
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    try {
      await api.deleteDocument(document._id);
      setToast("Document deleted successfully.");
      navigate("/documents");
    } catch (error: any) {
      setToast(error.message || "Failed to delete document");
    }
  };

  const verify = async () => {
    if (!document) return;
    try {
      await api.verifyDocumentStatus(document._id, "verified");
      setToast("Document verified successfully.");
      await loadDocument();
    } catch (error: any) {
      setToast(error.message || "Failed to verify document");
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar mobileNav={mobileNav} summary={summary} />
        <main>
          <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
          <div className="content" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <div className="spinner" />
          </div>
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="app-shell">
        <Sidebar mobileNav={mobileNav} summary={summary} />
        <main>
          <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
          <div className="content">
            <div className="empty-state">
              <FileText size={64} />
              <h3>Document not found</h3>
              <p>The document you're looking for doesn't exist or you don't have access to it.</p>
              <button className="button primary" onClick={() => navigate("/documents")}>
                <ArrowLeft size={18} /> Back to Documents
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
        <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
        <div className="content">
          <section className="hero-row">
            <div>
              <button
                className="button ghost"
                onClick={() => navigate("/documents")}
                style={{ marginBottom: "1rem", padding: "0.5rem 1rem" }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <p className="eyebrow">DOCUMENT DETAILS</p>
              <h1>{document.title}</h1>
              <p>{document.description || "No description provided"}</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="button secondary"
                onClick={toggleFavorite}
              >
                <Star size={18} fill={document.isFavorite ? "currentColor" : "none"} />
                {document.isFavorite ? "Favorited" : "Favorite"}
              </button>
              <button
                className="button secondary"
                onClick={download}
              >
                <Download size={18} /> Download
              </button>
              {document.status !== "verified" && (
                <button
                  className="button primary"
                  onClick={verify}
                >
                  <ShieldCheck size={18} /> Verify
                </button>
              )}
            </div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Document Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <FileText size={16} />
                  <span>{document.fileName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <HardDrive size={16} />
                  <span>{formatBytes(document.fileSize)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <Tag size={16} />
                  <span style={{ textTransform: "capitalize" }}>{document.category}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <Calendar size={16} />
                  <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Verification Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <ShieldCheck size={16} />
                  <span style={{ textTransform: "capitalize" }}>{document.status}</span>
                </div>
                {document.verifiedAt && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Clock size={16} />
                    <span>Verified {new Date(document.verifiedAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <Hash size={16} />
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{document.hash.slice(0, 32)}...</span>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Owner</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <User size={16} />
                  <span>{document.ownerName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <span style={{ fontSize: "0.75rem" }}>{document.ownerEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>Tags</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge blue"
                    style={{ cursor: "pointer" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "2rem", borderTop: "1px solid var(--border-color)" }}>
            <button
              className="button ghost"
              onClick={archive}
              style={{ color: "var(--accent-amber)" }}
            >
              <Archive size={18} /> Archive
            </button>
            <button
              className="button ghost"
              onClick={remove}
              style={{ color: "var(--accent-red)" }}
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>

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
