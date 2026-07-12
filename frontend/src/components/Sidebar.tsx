import { Check, FileCheck2, Files, FolderOpen, LayoutDashboard, MoreHorizontal, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Summary } from "../types.js";

interface SidebarProps {
  mobileNav: boolean;
  summary: Summary;
}

export function Sidebar({ mobileNav, summary }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <ShieldCheck />
        </div>
        <div>
          <strong>CertiVault</strong>
          <span>Document trust</span>
        </div>
      </div>
      <nav>
        <p>Workspace</p>
        <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
          <LayoutDashboard /> Dashboard
        </Link>
        <Link to="/documents" className={location.pathname === "/documents" ? "active" : ""}>
          <Files /> Documents <span className="nav-count">{summary.total}</span>
        </Link>
        <Link to="/verification" className={location.pathname === "/verification" ? "active" : ""}>
          <FileCheck2 /> Verification <span className="nav-count amber">{summary.pending}</span>
        </Link>
        <Link to="/shared-vaults" className={location.pathname === "/shared-vaults" ? "active" : ""}>
          <FolderOpen /> Shared vaults
        </Link>
        <p>Manage</p>
        <Link to="/team-members" className={location.pathname === "/team-members" ? "active" : ""}>
          <UserRound /> Team members
        </Link>
        <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
          <Settings /> Settings
        </Link>
      </nav>
      <div className="trust-card">
        <div className="trust-icon">
          <Sparkles size={18} />
        </div>
        <strong>Trust center</strong>
        <p>Your workspace is protected and all files are integrity checked.</p>
        <span>
          <Check size={13} /> Systems operational
        </span>
      </div>
      <div className="sidebar-user">
        <div className="avatar">KK</div>
        <div>
          <strong>Krishna Kumar</strong>
          <span>Project Admin</span>
        </div>
        <MoreHorizontal size={18} />
      </div>
    </aside>
  );
}
