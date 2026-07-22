import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileCheck2, Filter, ShieldCheck, X } from "lucide-react";
import { api } from "../api.js";
import { Verification, VerificationStatistics, Summary } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";

export default function Verifications() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [statistics, setStatistics] = useState<VerificationStatistics | null>(null);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, statsRes, sumRes] = await Promise.all([
        api.getVerifications({ search, status, method, page, limit: 20 }),
        api.getVerificationStatistics(),
        api.getDocumentSummary(),
      ]);
      setVerifications(vRes.verifications);
      setStatistics(statsRes.data);
      setSummary(sumRes.data);
      setTotalPages(vRes.totalPages);
    } catch (err: any) {
      setToast(err.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [search, status, method, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const clearFilters = () => { setStatus("all"); setMethod("all"); setSearch(""); setPage(1); };
  const hasActiveFilters = status !== "all" || method !== "all" || search !== "";

  const statusColor = (s: string) => {
    if (s === "verified")  return "green";
    if (s === "pending")   return "amber";
    return "red";
  };

  const statsItems = statistics ? [
    { label: "Total",    value: statistics.total,                          color: "var(--text-primary)" },
    { label: "Verified", value: statistics.verified,                       color: "var(--accent-green)" },
    { label: "Pending",  value: statistics.pending,                        color: "var(--accent-amber)" },
    { label: "Failed",   value: statistics.rejected + (statistics.tampered ?? 0), color: "var(--accent-red)" },
  ] : [];

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
              <p className="eyebrow">Verification</p>
              <h1>Verification History</h1>
              <p>Track and manage document verifications.</p>
            </div>
            <button className="button secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} aria-hidden="true" />
              Filters
              {hasActiveFilters && <span className="filter-active-chip">Active</span>}
            </button>
          </section>

          {/* Stats mini-cards */}
          {statistics && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
              {statsItems.map(({ label, value, color }) => (
                <div key={label} className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>{label}</span>
                  <strong style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Manrope', sans-serif", color, lineHeight: 1.15 }}>{value}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-grid">
                <div className="filter-field">
                  <label htmlFor="v-status">Status</label>
                  <select id="v-status" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="tampered">Tampered</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="v-method">Method</label>
                  <select id="v-method" value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="all">All methods</option>
                    <option value="manual">Manual</option>
                    <option value="qr">QR Code</option>
                    <option value="public">Public link</option>
                    <option value="hash">Hash</option>
                    <option value="api">API</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="filter-field" style={{ justifyContent: "flex-end" }}>
                    <button className="button ghost" onClick={clearFilters} style={{ alignSelf: "flex-end" }}>
                      <X size={15} /> Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table / states */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <div className="spinner" aria-label="Loading…" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="empty-state">
              <FileCheck2 size={56} />
              <h3>No verifications found</h3>
              <p>Verify your first document to get started.</p>
              <button className="button primary" onClick={() => navigate("/documents")}>
                <ShieldCheck size={16} /> Go to documents
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Verified by</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.125rem" }}>{v.documentTitle}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{v.documentHash.slice(0, 16)}…</div>
                      </td>
                      <td><span className={`badge ${statusColor(v.verificationStatus)}`}>{v.verificationStatus}</span></td>
                      <td style={{ textTransform: "capitalize" }}>{v.verificationMethod}</td>
                      <td>{v.verifiedByUser || "System"}</td>
                      <td>{v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button className="icon-button" style={{ width: 32, height: 32 }}
                          onClick={() => navigate(`/verification/${v.documentId}`)}
                          title="View details" aria-label={`View details for ${v.documentTitle}`}>
                          <FileCheck2 size={15} />
                        </button>
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

          {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={15} />{toast}</div>}
        </div>
      </main>
    </div>
  );
}
