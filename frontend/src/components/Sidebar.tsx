import React from "react";
import { Check, FileCheck2, Files, FolderOpen, LayoutDashboard, MoreHorizontal, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Summary } from "../types.js";

interface SidebarProps {
  mobileNav: boolean;
  summary: Summary;
}

export function Sidebar({ mobileNav, summary }: SidebarProps) {
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
        <a className="active">
          <LayoutDashboard /> Dashboard
        </a>
        <a>
          <Files /> Documents <span className="nav-count">{summary.total}</span>
        </a>
        <a>
          <FileCheck2 /> Verification <span className="nav-count amber">{summary.pending}</span>
        </a>
        <a>
          <FolderOpen /> Shared vaults
        </a>
        <p>Manage</p>
        <a>
          <UserRound /> Team members
        </a>
        <a>
          <Settings /> Settings
        </a>
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
