import { useEffect, useState } from "react"; // UPDATED
import { Check, FileCheck2, Files, FolderOpen, LayoutDashboard, Settings, ShieldCheck, Sparkles, Users, MoreHorizontal } from "lucide-react"; // UPDATED
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import { api } from "../api.js"; // UPDATED
import { Summary } from "../types.js";

interface SidebarProps {
  mobileNav: boolean;
  summary: Summary;
}

export function Sidebar({ mobileNav, summary }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  // UPDATED — live count of vaults shared with me
  const [sharedVaultCount, setSharedVaultCount] = useState(0);

  useEffect(() => {
    api.getSharedVaults()
      .then((res) => setSharedVaultCount(res.data.length))
      .catch(() => { /* silently ignore — sidebar badge is not critical */ });
  }, []);

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    const r = user?.role;
    if (r === "admin") return "Workspace Admin";
    if (r === "verifier") return "Verifier";
    return "Member";
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`sidebar ${mobileNav ? "open" : ""}`} aria-label="Main navigation">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck size={20} />
        </div>
        <div className="brand-text">
          <strong>CertiVault</strong>
          <span>Document trust</span>
        </div>
      </div>

      {/* Nav */}
      <nav>
        <p className="nav-section-label">Workspace</p>
        <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
          <LayoutDashboard size={18} aria-hidden="true" />
          Dashboard
        </Link>
        <Link to="/documents" className={isActive("/documents") ? "active" : ""}>
          <Files size={18} aria-hidden="true" />
          Documents
          {summary.total > 0 && (
            <span className="nav-count">{summary.total}</span>
          )}
        </Link>
        <Link to="/verification" className={isActive("/verification") ? "active" : ""}>
          <FileCheck2 size={18} aria-hidden="true" />
          Verification
          {summary.pending > 0 && (
            <span className="nav-count amber">{summary.pending}</span>
          )}
        </Link>

        <p className="nav-section-label">Vault</p>{/* UPDATED */}
        <Link to="/vault/members" className={isActive("/vault/members") ? "active" : ""}>
          <Users size={18} aria-hidden="true" />
          Vault Members
        </Link>
        <Link to="/vault/shared" className={location.pathname.startsWith("/vault/shared") ? "active" : ""}>
          <FolderOpen size={18} aria-hidden="true" />
          Shared Vaults
          {sharedVaultCount > 0 && (
            <span className="nav-count">{sharedVaultCount}</span>
          )}
        </Link>

        <p className="nav-section-label">Manage</p>
        <Link to="/settings" className={isActive("/settings") ? "active" : ""}>
          <Settings size={18} aria-hidden="true" />
          Settings
        </Link>
      </nav>

      {/* Trust card */}
      <div className="trust-card">
        <div className="trust-icon" aria-hidden="true">
          <Sparkles size={16} />
        </div>
        <strong>Trust center</strong>
        <p>Your workspace is protected and all files are integrity checked.</p>
        <span>
          <Check size={12} aria-hidden="true" /> Systems operational
        </span>
      </div>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="avatar avatar-lg" aria-hidden="true">
          {getUserInitials()}
        </div>
        <div>
          <strong>{user?.name || "User"}</strong>
          <span>{getRoleLabel()}</span>
        </div>
        <button className="more-btn" aria-label="User options">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </aside>
  );
}
