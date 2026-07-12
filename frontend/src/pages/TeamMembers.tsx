import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { Summary } from "../types.js";

export default function TeamMembers() {
  const navigate = useNavigate();
  const [summary] = useState<Summary>({ total: 0, verified: 0, pending: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [mobileNav, setMobileNav] = useState(false);

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
              <p className="eyebrow">TEAM</p>
              <h1>Team Members</h1>
              <p>Manage team members and permissions.</p>
            </div>
            <button
              className="button primary"
              disabled
            >
              <UserPlus size={18} /> Invite Member
            </button>
          </section>

          <div className="empty-state">
            <AlertCircle size={64} />
            <h3>Feature Not Available</h3>
            <p>The Team Members feature is not yet implemented. Backend APIs for team management are missing.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="button ghost" onClick={() => navigate("/documents")}>
                Go to Documents
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
