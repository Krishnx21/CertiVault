import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FolderOpen, Clock, CheckCircle2, AlertCircle, ArrowRight,
  LogOut, Shield, Eye, Users,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { api } from "../api.js";
import type { VaultMember, VaultMemberUser, Summary } from "../types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOwner(m: VaultMember): VaultMemberUser | null {
  if (m.vaultOwnerId && typeof m.vaultOwnerId === "object")
    return m.vaultOwnerId as VaultMemberUser;
  return null;
}

function expiryCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

function fmt(s: string) {
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Pending invite card ──────────────────────────────────────────────────────

function PendingCard({ invite, onAccept, onDecline }: {
  invite: VaultMember;
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
}) {
  const owner = getOwner(invite);
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);

  return (
    <div
      className="card"
      style={{ padding: "1.25rem", borderLeft: "3px solid var(--accent-blue)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        {/* Owner avatar */}
        <div
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "var(--accent-violet)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.9375rem", flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {owner?.name ? getInitials(owner.name) : "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
            {owner?.name ?? "Someone"} invited you
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.125rem 0 0.5rem" }}>
            {owner?.email}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className={`badge ${invite.role === "editor" ? "green" : "blue"}`}>
              {invite.role === "editor" ? <Shield size={11} /> : <Eye size={11} />}
              {invite.role}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={11} /> {expiryCountdown(invite.inviteExpiresAt)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button
            className="button ghost"
            style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", height: "auto" }}
            disabled={acting !== null}
            onClick={() => { setActing("decline"); onDecline(invite.inviteToken); }}
          >
            {acting === "decline" ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Decline"}
          </button>
          <button
            className="button primary"
            style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", height: "auto" }}
            disabled={acting !== null}
            onClick={() => { setActing("accept"); onAccept(invite.inviteToken); }}
          >
            {acting === "accept" ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active vault card ────────────────────────────────────────────────────────

function VaultCard({ membership, onOpen, onLeave }: {
  membership: VaultMember;
  onOpen: (m: VaultMember) => void;
  onLeave: (m: VaultMember) => void;
}) {
  const owner = getOwner(membership);

  return (
    <div
      className="card"
      style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--accent-blue)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1rem", flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {owner?.name ? getInitials(owner.name) : "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
            {owner?.name ?? "Unknown"}'s Vault
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.125rem 0 0" }}>
            {owner?.email}
          </p>
        </div>
        <span className={`badge ${membership.role === "editor" ? "green" : "blue"}`}>
          {membership.role === "editor" ? <Shield size={11} /> : <Eye size={11} />}
          {membership.role}
        </span>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
        Joined {membership.acceptedAt ? fmt(membership.acceptedAt) : "—"}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          className="button primary"
          style={{ flex: 1, gap: "0.375rem" }}
          onClick={() => onOpen(membership)}
        >
          Open Vault <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          style={{ color: "var(--accent-red)", width: 36, height: 36 }}
          onClick={() => onLeave(membership)}
          title="Leave vault"
          aria-label={`Leave ${owner?.name ?? "this"}'s vault`}
        >
          <LogOut size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedVaults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [mobileNav, setMobileNav] = useState(false);
  const [invites, setInvites] = useState<VaultMember[]>([]);
  const [activeVaults, setActiveVaults] = useState<VaultMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmLeave, setConfirmLeave] = useState<VaultMember | null>(null);

  // Handle ?invite=token from invite email link
  const inviteToken = searchParams.get("invite");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, vaultRes] = await Promise.all([
        api.getMyVaultInvites(),
        api.getSharedVaults(),
      ]);
      setInvites(invRes.data);
      setActiveVaults(vaultRes.data);
    } catch (e: any) {
      setError(e.message || "Failed to load vaults");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-scroll to invite if arriving from email link
  useEffect(() => {
    if (inviteToken && !loading) {
      const el = document.getElementById("pending-invites");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [inviteToken, loading]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2500);
    return () => clearTimeout(t);
  }, [success]);

  async function handleAccept(token: string) {
    try {
      await api.acceptVaultInvite(token);
      setSuccess("Invite accepted — you now have access to the vault");
      load();
    } catch (e: any) {
      setError(e.message || "Failed to accept invite");
    }
  }

  async function handleDecline(token: string) {
    try {
      await api.declineVaultInvite(token);
      setSuccess("Invite declined");
      load();
    } catch (e: any) {
      setError(e.message || "Failed to decline invite");
    }
  }

  async function handleLeave(membership: VaultMember) {
    const ownerId = typeof membership.vaultOwnerId === "string"
      ? membership.vaultOwnerId
      : (membership.vaultOwnerId as VaultMemberUser)._id;
    try {
      await api.leaveVault(ownerId);
      setSuccess("You left the vault");
      setConfirmLeave(null);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to leave vault");
    }
  }

  function openVault(m: VaultMember) {
    const ownerId = typeof m.vaultOwnerId === "string"
      ? m.vaultOwnerId
      : (m.vaultOwnerId as VaultMemberUser)._id;
    navigate(`/vault/shared/${ownerId}/documents`);
  }

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
              <h1>Shared Vaults</h1>
              <p>Vaults shared with you and pending invitations.</p>
            </div>
          </section>

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

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="spinner" /></div>
          ) : (
            <>
              {/* Pending invites */}
              {invites.length > 0 && (
                <section id="pending-invites" style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock size={16} aria-hidden="true" />
                    Pending Invitations
                    <span className="nav-count amber">{invites.length}</span>
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {invites.map((inv) => (
                      <PendingCard
                        key={inv._id}
                        invite={inv}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Active vaults */}
              <section>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FolderOpen size={16} aria-hidden="true" />
                  My Shared Vaults
                  {activeVaults.length > 0 && <span className="nav-count">{activeVaults.length}</span>}
                </h2>

                {activeVaults.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2.5rem" }}>
                    <Users size={44} aria-hidden="true" />
                    <h3>No vaults shared with you</h3>
                    <p>When someone invites you to their vault, it will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {activeVaults.map((v) => (
                      <VaultCard
                        key={v._id}
                        membership={v}
                        onOpen={openVault}
                        onLeave={(m) => setConfirmLeave(m)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Leave vault confirm dialog */}
      {confirmLeave && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setConfirmLeave(null)} aria-hidden="true" />
          <div style={{ position: "relative", zIndex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1.75rem", maxWidth: 380, width: "100%" }}>
            <h2 id="leave-dialog-title" style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>Leave vault?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
              You will lose access to {(getOwner(confirmLeave)?.name ?? "this user")}'s vault and its documents.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="button ghost" onClick={() => setConfirmLeave(null)}>Cancel</button>
              <button
                className="button"
                style={{ background: "var(--accent-red)", color: "#fff", border: "none" }}
                onClick={() => handleLeave(confirmLeave)}
              >
                Leave Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
