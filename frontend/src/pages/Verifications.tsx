import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  FileCheck2,
  Filter,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../api.js";
import { Verification, VerificationStatistics } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { Summary } from "../types.js";

export default function Verifications() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [statistics, setStatistics] = useState<VerificationStatistics | null>(null);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, archived: 0, favorites: 0, storageBytes: 0 });
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
      const [verificationsResponse, statsResponse, summaryResponse] = await Promise.all([
        api.getVerifications({ search, status, method, page, limit: 20 }),
        api.getVerificationStatistics(),
        api.getDocumentSummary(),
      ]);
      setVerifications(verificationsResponse.verifications);
      setStatistics(statsResponse.data);
      setSummary(summaryResponse.data);
      setTotalPages(verificationsResponse.totalPages);
    } catch (error: any) {
      console.error("Failed to load verifications:", error);
      setToast(error.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [search, status, method, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const clearFilters = () => {
    setStatus("all");
    setMethod("all");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = status !== "all" || method !== "all" || search !== "";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "green";
      case "pending": return "amber";
      case "rejected": return "red";
      case "expired": return "red";
      case "tampered": return "red";
      case "revoked": return "red";
      default: return "blue";
    }
  };

  const viewDetail = (documentId: string) => {
    navigate(`/verification/${documentId}`);
  };

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
              <p className="eyebrow">VERIFICATION</p>
              <h1>Verification History</h1>
              <p>Track and manage document verifications.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="button secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} /> Filters {hasActiveFilters && <span style={{ marginLeft: "0.5rem", padding: "0.125rem 0.5rem", background: "var(--accent-blue)", borderRadius: "9999px", fontSize: "0.75rem" }}>Active</span>}
              </button>
            </div>
          </section>

          {statistics && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{statistics.total}</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Verified</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)" }}>{statistics.verified}</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Pending</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-amber)" }}>{statistics.pending}</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Failed</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-red)" }}>{statistics.rejected + statistics.tampered}</div>
              </div>
            </div>
          )}

          {showFilters && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "0.5rem", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "0.95rem" }}
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="tampered">Tampered</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "0.95rem" }}
                  >
                    <option value="all">All Methods</option>
                    <option value="manual">Manual</option>
                    <option value="qr">QR Code</option>
                    <option value="public">Public Link</option>
                    <option value="hash">Hash</option>
                    <option value="api">API</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    className="button ghost"
                    onClick={clearFilters}
                    style={{ padding: "0.75rem 1rem" }}
                  >
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <div className="spinner" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="empty-state">
              <FileCheck2 size={64} />
              <h3>No verifications found</h3>
              <p>Verify your first document to get started.</p>
              <button className="button primary" onClick={() => navigate("/documents")}>
                <ShieldCheck size={18} /> Go to Documents
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
                    <th>Verified By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((verification) => (
                    <tr key={verification._id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{verification.documentTitle}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{verification.documentHash.slice(0, 16)}...</div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(verification.verificationStatus)}`}>
                          {verification.verificationStatus}
                        </span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{verification.verificationMethod}</td>
                      <td>{verification.verifiedByUser || "System"}</td>
                      <td>{verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="icon-button"
                            onClick={() => viewDetail(verification.documentId)}
                            title="View Details"
                          >
                            <FileCheck2 size={16} />
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
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
              <button
                className="button ghost"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "0.5rem 1rem" }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`button ${page === p ? "primary" : "ghost"}`}
                  onClick={() => setPage(p)}
                  style={{ padding: "0.5rem 1rem", minWidth: "40px" }}
                >
                  {p}
                </button>
              ))}
              <button
                className="button ghost"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "0.5rem 1rem" }}
              >
                Next
              </button>
            </div>
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
