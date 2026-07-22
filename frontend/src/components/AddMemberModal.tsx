import { useState } from "react";
import { X, Shield, Eye, AlertCircle } from "lucide-react";
import { api } from "../api.js";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await api.inviteVaultMember({ memberEmail: email.trim().toLowerCase(), role });
      onSuccess();
    } catch (e: any) {
      const msg: string = e.message || "Failed to send invite";
      if (msg.includes("already")) {
        setError("This person is already invited or has access to your vault.");
      } else if (msg.includes("yourself")) {
        setError("You cannot invite yourself to your own vault.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          width: "100%", maxWidth: 440,
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 id="add-member-title" style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            Add Vault Member
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Close modal" style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="member-email" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
              Email address
            </label>
            <input
              id="member-email"
              type="email"
              className="input"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{ width: "100%" }}
              aria-required="true"
            />
          </div>

          {/* Role */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
              Role
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {([
                { value: "viewer", icon: <Eye size={16} />, label: "Viewer", desc: "Can browse and download documents" },
                { value: "editor", icon: <Shield size={16} />, label: "Editor", desc: "Can view and upload new documents" },
              ] as const).map(({ value, icon, label, desc }) => (
                <label
                  key={value}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem",
                    padding: "0.875rem", borderRadius: "var(--radius-md)",
                    border: `1.5px solid ${role === value ? "var(--accent-blue)" : "var(--border-color)"}`,
                    background: role === value ? "rgba(59,130,246,.06)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="vault-role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    style={{ marginTop: 2, accentColor: "var(--accent-blue)" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: role === value ? "var(--accent-blue)" : "var(--text-secondary)" }}>{icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{label}</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", width: "100%" }}>{desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem", borderRadius: "var(--radius-md)",
                background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                color: "var(--accent-red)", fontSize: "0.875rem", marginBottom: "1rem",
              }}
            >
              <AlertCircle size={15} aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="button ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {loading ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
