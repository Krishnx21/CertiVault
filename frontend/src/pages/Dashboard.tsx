import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, FileClock, Files, HardDrive,
  ShieldCheck, Upload, Search, Share2, Star, XCircle,
} from "lucide-react";
import { api } from "../api.js";
import { Document, Summary, Activity, AppNotification } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { StatCard } from "../components/StatCard.js";
import { StatCardSkeleton } from "../components/SkeletonLoader.js";
import { ActivityTimeline } from "../components/ActivityTimeline.js";
import { Notifications } from "../components/Notifications.js";
import { UploadModal } from "../components/UploadModal.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [userName, setUserName] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, activitiesRes, notifRes, recentRes] = await Promise.all([
        api.getDocumentSummary(),
        api.getActivityTimeline(10),
        api.getNotifications(5),
        api.getRecentDocuments(5),
      ]);
      setSummary({ ...summaryRes.data, rejected: summaryRes.data.rejected || 0 });
      setActivities(activitiesRes.data);
      const formattedNotifications = (((notifRes as any)?.data?.notifications || (notifRes as any)?.notifications || []) as any[]).map(n => ({
        id: n._id || n.id,
        type: (n.type === "info" || n.type === "success" || n.type === "warning" || n.type === "error") ? n.type : "info",
        title: n.title,
        message: n.message,
        documentId: n.data?.documentId || n.documentId,
        documentTitle: n.data?.documentTitle || n.documentTitle,
        timestamp: n.createdAt || n.timestamp,
        read: n.isRead !== undefined ? n.isRead : !!n.read
      }));
      setNotifications(formattedNotifications);
      setRecentDocuments(recentRes.data);
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUserName(u.name || u.email?.split("@")[0] || "");
      }
    } catch (err: any) {
      setToast(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshAfterUpload = async () => {
    setUploadOpen(false);
    setToast("Document uploaded successfully.");
    await load();
  };

  const handleQuickAction = (action: string) => {
    if (action === "upload") setUploadOpen(true);
    else if (action === "verify") navigate("/verification");
    else if (action === "share") navigate("/shared-vaults");
    else if (action === "search") navigate("/documents");
  };

  const quickActions = [
    { key: "upload", icon: Upload,      label: "Upload",  color: "var(--accent-blue)",   bg: "rgba(59,130,246,.1)"  },
    { key: "verify", icon: CheckCircle2, label: "Verify",  color: "var(--accent-green)",  bg: "rgba(16,185,129,.1)"  },
    { key: "share",  icon: Share2,       label: "Share",   color: "var(--accent-violet)", bg: "rgba(139,92,246,.1)"  },
    { key: "search", icon: Search,       label: "Browse",  color: "var(--accent-amber)",  bg: "rgba(245,158,11,.1)"  },
  ];

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && (
        <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />
      )}
      <main>
        <Topbar setMobileNav={setMobileNav} />
        <div className="content">

          {/* Hero */}
          <section className="hero-row">
            <div>
              <p className="eyebrow">Command center</p>
              <h1>{getGreeting()}{userName ? `, ${userName}` : ""}.</h1>
              <p>Here's what's happening across your secure workspace.</p>
            </div>
            <button className="button primary upload-button" onClick={() => setUploadOpen(true)}>
              <Upload size={17} aria-hidden="true" /> Upload document
            </button>
          </section>

          {/* Stats */}
          <section className="stats-grid" aria-label="Document statistics">
            {loading ? (
              <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
            ) : (
              <>
                <StatCard icon={Files}       label="Total Documents" value={summary.total}               note="Across your workspace"           tone="blue"   />
                <StatCard icon={CheckCircle2} label="Verified"        value={summary.verified}            note={`${summary.total ? Math.round((summary.verified / summary.total) * 100) : 0}% verification rate`} tone="green"  />
                <StatCard icon={FileClock}    label="Pending"         value={summary.pending}             note="Requires attention"              tone="amber"  />
                <StatCard icon={XCircle}      label="Rejected"        value={summary.rejected}            note="Verification failed"             tone="red"    />
                <StatCard icon={Star}         label="Favorites"       value={summary.favorites}           note="Starred documents"               tone="violet" />
                <StatCard icon={HardDrive}    label="Storage used"    value={formatBytes(summary.storageBytes)} note="Encrypted at rest"          tone="blue"   />
              </>
            )}
          </section>

          {/* Quick Actions */}
          <section className="mb-8">
            <div className="section-row">
              <h2>Quick actions</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem" }}>
              {quickActions.map(({ key, icon: Icon, label, color, bg }) => (
                <button
                  key={key}
                  onClick={() => handleQuickAction(key)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem",
                    padding: "1.125rem 0.75rem",
                    background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-xl)", cursor: "pointer",
                    transition: "border-color var(--t-normal), transform var(--t-normal), box-shadow var(--t-normal)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ width: 44, height: 44, background: bg, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={color} aria-hidden="true" />
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Activity + Notifications */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <ActivityTimeline activities={activities} loading={loading} />
            <Notifications notifications={notifications} loading={loading} onDismiss={(id) => setNotifications(notifications.filter(n => n.id !== id))} />
          </div>

          {/* Recent Uploads */}
          <section className="mb-8">
            <div className="section-row">
              <h2>Recent uploads</h2>
              <button className="button ghost" style={{ fontSize: "0.875rem" }} onClick={() => navigate("/documents")}>
                View all
              </button>
            </div>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "var(--radius-md)" }} />
                    <div className="skeleton" style={{ height: 14, width: "75%", borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem", gap: "0.75rem", textAlign: "center" }}>
                <Files size={40} color="var(--text-muted)" aria-hidden="true" />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No recent uploads</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
                {recentDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="document-card"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/documents/${doc._id}`)}
                    aria-label={`Open ${doc.title}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-violet))", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.125rem", flexShrink: 0, fontFamily: "'Manrope', sans-serif" }}>
                        {doc.fileName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="truncate" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>{doc.title}</p>
                        <p className="truncate" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatBytes(doc.fileSize)}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className={`badge ${doc.status === "verified" ? "green" : doc.status === "rejected" ? "red" : "amber"}`}>
                        {doc.status}
                      </span>
                      {doc.isFavorite && <Star size={14} color="var(--accent-amber)" fill="var(--accent-amber)" aria-label="Favorited" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer>
            <span><ShieldCheck size={14} aria-hidden="true" /> Protected by CertiVault integrity controls</span>
            <span>© 2026 CertiVault</span>
          </footer>
        </div>
      </main>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refreshAfterUpload} />}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  );
}
