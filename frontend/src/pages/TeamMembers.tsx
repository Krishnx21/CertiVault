import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, ArrowRight } from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { Summary } from "../types.js";

export default function TeamMembers() {
  const navigate = useNavigate();
  const [summary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && (
        <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />
      )}
      <main>
        <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
        <div className="content">
          <section className="hero-row">
            <div>
              <p className="eyebrow">Team</p>
              <h1>Team Members</h1>
              <p>Manage team members and permissions.</p>
            </div>
            <button className="button primary" disabled aria-disabled="true">
              <UserPlus size={16} aria-hidden="true" /> Invite member
            </button>
          </section>

          <div className="empty-state">
            <Users size={56} aria-hidden="true" />
            <h3>Team management coming soon</h3>
            <p>
              Team member management is not yet available. You can still share
              individual documents with collaborators from the Shared Vaults page.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button className="button primary" onClick={() => navigate("/shared-vaults")}>
                <ArrowRight size={16} /> Go to Shared Vaults
              </button>
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
