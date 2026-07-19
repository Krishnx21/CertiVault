import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, AlertCircle, Upload } from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { DocumentTable } from "../components/DocumentTable.js";
import { UploadModal } from "../components/UploadModal.js";
import { api } from "../api.js";
import type { Document, VaultMember, VaultMemberUser, Summary } from "../types.js";

function getOwner(m: VaultMember): VaultMemberUser | null {
  if (m.vaultOwnerId && typeof m.vaultOwnerId === "object")
    return m.vaultOwnerId as VaultMemberUser;
  return null;
}

export default function SharedVaultDocuments() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const navigate = useNavigate();

  const [summary] = useState<Summary>({
    total: 0, verified: 0, pending: 0, rejected: 0, archived: 0,
    favorites: 0, storageBytes: 0,
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [membership, setMembership] = useState<VaultMember | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showUpload, setShowUpload] = useState(false);

  // ── resolve membership ──────────────────────────────────────────────────────
  const loadMembership = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await api.getSharedVaults();
      const found = res.data.find((m) => {
        const id =
          typeof m.vaultOwnerId === "string"
            ? m.vaultOwnerId
            : (m.vaultOwnerId as VaultMemberUser)._id;
        return id === ownerId;
      });
      if (!found) {
        setError("You do not have access to this vault.");
        setLoading(false);
        return;
      }
      setMembership(found);
    } catch (e: any) {
      setError(e.message || "Failed to load vault info");
      setLoading(false);
    }
  }, [ownerId]);

  // ── load documents ──────────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.getVaultDocuments(ownerId, {
        page,
        limit: 20,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        sortBy,
      });
      setDocuments(res.documents);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [ownerId, page, search, status, sortBy]);

  useEffect(() => { loadMembership(); }, [loadMembership]);
  useEffect(() => { if (membership) loadDocuments(); }, [loadDocuments, membership]);

  const ownerInfo = membership ? getOwner(membership) : null;
  const ownerName = ownerInfo?.name ?? "Vault Owner";
  const role = membership?.role ?? "viewer";
  const isEditor = role === "editor";

  // no-ops: vault members cannot delete documents; viewers cannot archive
  const noOp = () => { /* intentionally empty */ };

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <main>
        <Topbar search={search} setSearch={setSearch} setMobileNav={setMobileNav} />
        <div className="content">

          {/* ── Header ── */}
          <section className="hero-row">
            <div>
              <button
                className="button ghost"
                style={{ marginBottom: "0.75rem", padding: "0.25rem 0.5rem", fontSize: "0.875rem", height: "auto" }}
                onClick={() => navigate("/vault/shared")}
              >
                <ArrowLeft size={14} aria-hidden="true" /> My Vaults
              </button>

              <p className="eyebrow">Shared Vault</p>
              <h1 style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                {ownerName}&apos;s Vault
                <span
                  className={`badge ${isEditor ? "green" : "blue"}`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {isEditor
                    ? <Shield size={11} aria-hidden="true" />
                    : <Eye size={11} aria-hidden="true" />}
                  Viewing as {isEditor ? "Editor" : "Viewer"}
                </span>
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                {total} document{total !== 1 ? "s" : ""}
                {isEditor
                  ? " · You can upload documents to this vault"
                  : " · View and download only"}
              </p>
            </div>

            {isEditor && (
              <button className="button primary" onClick={() => setShowUpload(true)}>
                <Upload size={16} aria-hidden="true" /> Upload
              </button>
            )}
          </section>

          {/* ── Error ── */}
          {error && (
            <div
              className="upload-error"
              role="alert"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}
            >
              <AlertCircle size={16} aria-hidden="true" />{error}
            </div>
          )}

          {/* ── Document table ── */}
          {/* Pass no-op handlers for delete/archive — the table renders the
              buttons but they do nothing. The owner's own Documents page is
              the only place those operations should succeed. */}
          <DocumentTable
            documents={documents}
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            loading={loading}
            onVerify={noOp}
            onDelete={noOp}
            onToggleFavorite={noOp}
            onArchive={noOp}
            onRestore={noOp}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onViewVerification={(id) => navigate(`/verification/${id}`)}
          />
        </div>
      </main>

      {/* ── Upload modal (editors only) ── */}
      {showUpload && isEditor && ownerId && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); loadDocuments(); }}
          vaultOwnerId={ownerId}
        />
      )}
    </div>
  );
}
