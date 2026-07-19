import { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Users, CheckCircle2, AlertCircle,
  Trash2, RefreshCw, ChevronDown, Shield, Eye,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { AddMemberModal } from "../components/AddMemberModal.js";
import { api } from "../api.js";
import type { VaultMember, VaultMemberList, VaultMemberUser, Summary } from "../types.js";

type Tab = "active" | "pending" | "declined";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function expiryCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `Expires in ${h}h ${m}m` : `Expires in ${m}m`;
}

function getMemberUser(m: VaultMember): VaultMemberUser | null {
  if (!m.memberUserId) return null;
  if (typeof m.memberUserId === "object") return m.memberUserId as VaultMemberUser;
  return null;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, email }: { name?: string; email: string }) {
  const label = name ? getInitials(name) : email[0].toUpperCase();
  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "var(--accent-blue)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

// ─── Role dropdown ────────────────────────────────────────────────────────────

function RoleDropdown({
  memberId, current, onChange,
}: { memberId: string; current: "viewer" | "editor"; onChange: (id: string, role: "viewer" | "editor") => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="button ghost"
        style={{ padding: "0.25rem 0.625rem", fontSize: "0.8125rem", gap: "0.25rem", height: "auto" }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current === "editor" ? <Shield size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
        {current === "editor" ? "Editor" : "Viewer"}
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
            background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
            minWidth: 140, overflow: "hidden",
          }}
        >
          {(["viewer", "editor"] as const).map((r) => (
            <button
              key={r}
              role="option"
              aria-selected={r === current}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                width: "100%", padding: "0.625rem 0.875rem", background: "none",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: "0.875rem", color: "var(--text-primary)",
                fontWeight: r === current ? 600 : 400,
              }}
              onClick={() => { onChange(memberId, r); setOpen(false); }}
            >
              {r === "editor" ? <Shield size={14} /> : <Eye size={14} />}
              <div>
                <div>{r === "editor" ? "Editor" : "Viewer"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {r === "editor" ? "Can view & upload" : "Can view only"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VaultMembers() {
  const [summary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [mobileNav, setMobileNav] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [members, setMembers] = useState<VaultMemberList>({ active: [], pending: [], declined: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listVaultMembers();
      setMembers(res.data);
    } catch (e: any) {
      setError(e.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2500);
    return () => clearTimeout(t);
  }, [success]);

  async function handleRoleChange(memberId: string, role: "viewer" | "editor") {
    try {
      await api.changeVaultMemberRole(memberId, role);
      setSuccess("Role updated");
      load();
    } catch (e: any) {
      setError(e.message || "Failed to update role");
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await api.removeVaultMember(memberId);
      setSuccess("Member removed");
      setConfirmRemoveId(null);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to remove member");
    }
  }

  async function handleResend(memberId: string) {
    try {
      await api.resendVaultInvite(memberId);
      setSuccess("Invite resent");
    } catch (e: any) {
      setError(e.message || "Failed to resend invite");
    }
  }

  const tabList: { key: Tab; label: string; count: number }[] = [
    { key: "active",   label: "Active",   count: members.active.length },
    { key: "pending",  label: "Pending",  count: members.pending.length },
    { key: "declined", label: "Declined", count: members.declined.length },
  ];

  const rows = members[activeTab];

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main>
        <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
        <div className="content">

          {/* Header */}
          <section className="hero-row">
            <div>
              <p className="eyebrow">Vault</p>
              <h1>Vault Members</h1>
              <p>Invite people to view or edit documents in your vault.</p>
            </div>
            <button className="button primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} aria-hidden="true" /> Add Member
            </button>
          </section>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Active members",  value: members.active.length,   color: "var(--accent-green)" },
              { label: "Pending invites", value: members.pending.length,  color: "var(--accent-amber)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: "1rem 1.25rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{label}</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="upload-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <AlertCircle size={16} aria-hidden="true" />{error}
            </div>
          )}
          {success && (
            <div role="status" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0.875rem", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: "var(--radius-md)", color: "var(--accent-green)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              <CheckCircle2 size={16} aria-hidden="true" />{success}
            </div>
          )}

          {/* Tabs */}
          <div className="tabs" role="tablist" style={{ marginBottom: "1rem" }}>
            {tabList.map(({ key, label, count }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                className={`tab-btn ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
                {count > 0 && (
                  <span className={`nav-count ${key === "pending" ? "amber" : ""}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="spinner" /></div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <Users size={48} aria-hidden="true" />
              <h3>No {activeTab} members</h3>
              <p>
                {activeTab === "active" && "No one has access to your vault yet. Add a member to get started."}
                {activeTab === "pending" && "No pending invites."}
                {activeTab === "declined" && "No declined invites."}
              </p>
              {activeTab === "active" && (
                <button className="button primary" onClick={() => setShowAddModal(true)}>
                  <UserPlus size={16} /> Add Member
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px auto", gap: "0.75rem", padding: "0.375rem 1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>{activeTab === "active" ? "Member" : "Email"}</span>
                <span>Role</span>
                <span>{activeTab === "active" ? "Joined" : activeTab === "pending" ? "Expires" : "Declined"}</span>
                <span></span>
                <span></span>
              </div>

              {rows.map((m) => {
                const user = getMemberUser(m);
                return (
                  <div key={m._id} className="card" style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px auto", gap: "0.75rem", alignItems: "center", padding: "0.875rem 1rem" }}>
                    {/* Avatar + name/email */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                      <Avatar name={user?.name} email={m.memberEmail} />
                      <div style={{ minWidth: 0 }}>
                        {user?.name && <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>{user.name}</p>}
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>{m.memberEmail}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      {activeTab === "active" ? (
                        <RoleDropdown memberId={m._id} current={m.role} onChange={handleRoleChange} />
                      ) : (
                        <span className={`badge ${m.role === "editor" ? "green" : "blue"}`}>{m.role}</span>
                      )}
                    </div>

                    {/* Date */}
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
                      {activeTab === "active" && m.acceptedAt && fmt(m.acceptedAt)}
                      {activeTab === "pending" && <span style={{ color: "var(--accent-amber)" }}>{expiryCountdown(m.inviteExpiresAt)}</span>}
                      {activeTab === "declined" && m.declinedAt && fmt(m.declinedAt)}
                    </p>

                    {/* Secondary action */}
                    <div>
                      {activeTab === "pending" && (
                        <button
                          className="button ghost"
                          style={{ padding: "0.25rem 0.625rem", fontSize: "0.8125rem", height: "auto" }}
                          onClick={() => handleResend(m._id)}
                          title="Resend invite"
                        >
                          <RefreshCw size={13} aria-hidden="true" /> Resend
                        </button>
                      )}
                    </div>

                    {/* Remove */}
                    <div>
                      {(activeTab === "active" || activeTab === "pending") && (
                        confirmRemoveId === m._id ? (
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <button className="button" style={{ background: "var(--accent-red)", color: "#fff", padding: "0.25rem 0.625rem", fontSize: "0.8125rem", height: "auto", border: "none" }} onClick={() => handleRemove(m._id)}>
                              Confirm
                            </button>
                            <button className="button ghost" style={{ padding: "0.25rem 0.625rem", fontSize: "0.8125rem", height: "auto" }} onClick={() => setConfirmRemoveId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="icon-button"
                            style={{ color: "var(--accent-red)", width: 32, height: 32 }}
                            onClick={() => setConfirmRemoveId(m._id)}
                            aria-label={activeTab === "active" ? "Remove member" : "Cancel invite"}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); setSuccess("Invite sent"); load(); }}
        />
      )}
    </div>
  );
}
