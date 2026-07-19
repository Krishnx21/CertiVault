import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, User, Shield, Palette, Bell, Monitor,
  LogOut, Trash2, Camera, Check, X, Moon, Sun, Save,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar.js";
import { Topbar } from "../components/Topbar.js";
import { Summary } from "../types.js";
import { api } from "../api.js";

type Tab = "profile" | "security" | "appearance" | "notifications" | "sessions";

const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
  { key: "profile",       icon: <User size={16} />,    label: "Profile" },
  { key: "security",      icon: <Shield size={16} />,  label: "Security" },
  { key: "appearance",    icon: <Palette size={16} />, label: "Appearance" },
  { key: "notifications", icon: <Bell size={16} />,    label: "Notifications" },
  { key: "sessions",      icon: <Monitor size={16} />, label: "Sessions" },
];

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; id: string; label: string; description?: string; }
function Toggle({ checked, onChange, id, label, description }: ToggleProps) {
  return (
    <label htmlFor={id} className="toggle-row" style={{ cursor: "pointer" }}>
      <div className="toggle-row-text">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        type="button"
      />
    </label>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary] = useState<Summary>({ total: 0, verified: 0, pending: 0, rejected: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [mobileNav, setMobileNav] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  const [notifications, setNotifications] = useState({ emailNotifications: true, documentShared: true, documentVerified: true, expiryReminders: true, teamUpdates: true });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
    const saved = localStorage.getItem("theme") as "light" | "dark";
    if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
  }, []);

  useEffect(() => {
    if (activeTab === "sessions") loadSessions();
    setError(""); setSuccess("");
  }, [activeTab]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(t);
  }, [success]);

  const loadProfile = async () => {
    try {
      const r = await api.getProfile();
      setProfile(r.data);
      setName(r.data.name || "");
      setBio(r.data.bio || "");
      setAvatar(r.data.avatar || "");
      setNotifications(r.data.notificationPreferences || notifications);
    } catch { /* silent */ }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try { const r = await api.getSessions(); setSessions(r.data); }
    catch { /* silent */ }
    finally { setIsLoadingSessions(false); }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateAvatar = async () => {
    try { const r = await api.generateAvatar(name); setAvatar(r.data.avatarUrl); setSuccess("Avatar generated"); }
    catch (err: any) { setError(err.message || "Failed to generate avatar"); }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true); setError(""); setSuccess("");
    try { await api.updateProfile({ name, bio, avatar }); setSuccess("Profile updated"); loadProfile(); }
    catch (err: any) { setError(err.message || "Failed to update profile"); }
    finally { setIsSavingProfile(false); }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    setIsChangingPassword(true); setError(""); setSuccess("");
    try { await api.changePassword({ currentPassword, newPassword }); setSuccess("Password changed"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    catch (err: any) { setError(err.message || "Failed to change password"); }
    finally { setIsChangingPassword(false); }
  };

  const updateEmail = async () => {
    setIsUpdatingEmail(true); setError(""); setSuccess("");
    try { await api.updateEmail({ newEmail, password: emailPassword }); setSuccess("Email updated — check your inbox for verification."); setNewEmail(""); setEmailPassword(""); }
    catch (err: any) { setError(err.message || "Failed to update email"); }
    finally { setIsUpdatingEmail(false); }
  };

  const saveNotifications = async () => {
    setIsSavingNotifications(true); setError(""); setSuccess("");
    try { await api.updateNotificationPreferences(notifications); setSuccess("Notification preferences saved"); }
    catch (err: any) { setError(err.message || "Failed to save"); }
    finally { setIsSavingNotifications(false); }
  };

  const toggleTheme = (t: "light" | "dark") => { setTheme(t); localStorage.setItem("theme", t); document.documentElement.setAttribute("data-theme", t); };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return setError('Type "DELETE" to confirm');
    setIsDeletingAccount(true); setError(""); setSuccess("");
    try { await api.deleteAccount({ password: deletePassword, confirmation: deleteConfirmation }); localStorage.clear(); navigate("/login"); }
    catch (err: any) { setError(err.message || "Failed to delete account"); }
    finally { setIsDeletingAccount(false); }
  };

  const revokeAllSessions = async () => {
    try { await api.revokeAllSessions(); setSuccess("All other sessions revoked"); loadSessions(); }
    catch (err: any) { setError(err.message || "Failed to revoke sessions"); }
  };

  const revokeSession = async (id: string) => {
    try { await api.revokeSession(id); setSuccess("Session revoked"); loadSessions(); }
    catch (err: any) { setError(err.message || "Failed to revoke session"); }
  };

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} summary={summary} />
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main>
        <Topbar search="" setSearch={() => {}} setMobileNav={setMobileNav} />
        <div className="content">
          <section className="hero-row">
            <div>
              <p className="eyebrow">Settings</p>
              <h1>Account Settings</h1>
              <p>Manage your account and preferences.</p>
            </div>
          </section>

          {/* Messages */}
          {error && (
            <div className="upload-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }} role="alert">
              <AlertCircle size={16} aria-hidden="true" />{error}
            </div>
          )}
          {success && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0.875rem", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: "var(--radius-md)", color: "var(--accent-green)", fontSize: "0.875rem", marginBottom: "1rem" }} role="status">
              <Check size={16} aria-hidden="true" />{success}
            </div>
          )}

          {/* Tabs */}
          <div className="tabs" role="tablist" style={{ marginBottom: "1.75rem" }}>
            {TABS.map(({ key, icon, label }) => (
              <button key={key} role="tab" aria-selected={activeTab === key}
                className={`tab-btn ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <div className="form-fields" style={{ maxWidth: 560 }}>
              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", border: "2px solid var(--border-color)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {avatar ? <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-muted)", fontFamily: "'Manrope', sans-serif" }}>{name.charAt(0).toUpperCase() || "?"}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button className="button ghost" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={16} /> Upload photo
                  </button>
                  <button className="button ghost" onClick={generateAvatar}>
                    Generate avatar
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="visually-hidden" aria-hidden="true" />
                </div>
              </div>
              <div className="field-label"><span>Name</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
              <div className="field-label"><span>Email</span><input type="email" value={profile?.email || ""} disabled /></div>
              <div className="field-label">
                <span>Bio</span>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself" rows={3} maxLength={500} />
                <small style={{ alignSelf: "flex-end" }}>{bio.length}/500</small>
              </div>
              <div>
                <button className="button primary" onClick={saveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? <><div className="spinner spinner-sm" />Saving…</> : <><Save size={16} />Save changes</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="form-fields">
                <h3 style={{ marginBottom: 0 }}>Change password</h3>
                <div className="field-label"><span>Current password</span><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" /></div>
                <div className="field-label"><span>New password</span><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" /></div>
                <div className="field-label"><span>Confirm new password</span><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" /></div>
                <div><button className="button primary" onClick={changePassword} disabled={isChangingPassword}>{isChangingPassword ? <><div className="spinner spinner-sm" />Changing…</> : "Change password"}</button></div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                <div className="form-fields">
                  <h3 style={{ marginBottom: 0 }}>Change email</h3>
                  <div className="field-label"><span>New email address</span><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="your@new-email.com" /></div>
                  <div className="field-label"><span>Current password</span><input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Confirm with your password" /></div>
                  <div><button className="button primary" onClick={updateEmail} disabled={isUpdatingEmail}>{isUpdatingEmail ? <><div className="spinner spinner-sm" />Updating…</> : "Update email"}</button></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(239,68,68,.3)", paddingTop: "1.5rem", background: "rgba(239,68,68,.04)", borderRadius: "var(--radius-lg)", padding: "1.25rem" }}>
                <div className="form-fields">
                  <h3 style={{ color: "var(--accent-red)", marginBottom: 0 }}>Danger zone</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>Permanently delete your account and all data. This cannot be undone.</p>
                  <div className="field-label"><span>Password</span><input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password" /></div>
                  <div className="field-label"><span>Type "DELETE" to confirm</span><input type="text" value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="DELETE" /></div>
                  <div>
                    <button className="button danger" onClick={deleteAccount} disabled={isDeletingAccount}>
                      {isDeletingAccount ? <><div className="spinner spinner-sm" />Deleting…</> : <><Trash2 size={16} />Delete my account</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {activeTab === "appearance" && (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 style={{ marginBottom: "1rem" }}>Theme</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  {([
                    { key: "light", icon: <Sun size={22} />, label: "Light", desc: "Clean and bright" },
                    { key: "dark",  icon: <Moon size={22} />, label: "Dark",  desc: "Easy on the eyes" },
                  ] as const).map(({ key, icon, label, desc }) => (
                    <button key={key} onClick={() => toggleTheme(key)}
                      style={{
                        padding: "1rem", borderRadius: "var(--radius-lg)", border: `2px solid ${theme === key ? "var(--accent-blue)" : "var(--border-color)"}`,
                        background: theme === key ? "var(--bg-tertiary)" : "transparent", cursor: "pointer", textAlign: "left",
                        transition: "border-color var(--t-fast)", display: "flex", flexDirection: "column", gap: "0.375rem",
                      }}>
                      <span style={{ color: theme === key ? "var(--accent-blue)" : "var(--text-secondary)" }}>{icon}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{label}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-fields">
                <div className="field-label">
                  <span>Language</span>
                  <select value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div className="field-label">
                  <span>Timezone</span>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ marginBottom: 0 }}>Email notifications</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <Toggle id="n-email"    checked={notifications.emailNotifications} onChange={v => setNotifications({ ...notifications, emailNotifications: v })}    label="Email notifications"  description="Receive email updates" />
                <Toggle id="n-shared"   checked={notifications.documentShared}     onChange={v => setNotifications({ ...notifications, documentShared: v })}         label="Document shared"       description="When someone shares a document with you" />
                <Toggle id="n-verified" checked={notifications.documentVerified}   onChange={v => setNotifications({ ...notifications, documentVerified: v })}       label="Document verified"     description="When your document is verified" />
                <Toggle id="n-expiry"   checked={notifications.expiryReminders}    onChange={v => setNotifications({ ...notifications, expiryReminders: v })}        label="Expiry reminders"      description="Remind before documents expire" />
                <Toggle id="n-team"     checked={notifications.teamUpdates}        onChange={v => setNotifications({ ...notifications, teamUpdates: v })}            label="Team updates"          description="Updates from your team" />
              </div>
              <div>
                <button className="button primary" onClick={saveNotifications} disabled={isSavingNotifications}>
                  {isSavingNotifications ? <><div className="spinner spinner-sm" />Saving…</> : <><Save size={16} />Save preferences</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Sessions ── */}
          {activeTab === "sessions" && (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ marginBottom: 0 }}>Active sessions</h3>
              {isLoadingSessions ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><div className="spinner" /></div>
              ) : sessions.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No active sessions found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.875rem 1rem", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                      <Monitor size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="truncate" style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "0.2rem" }}>{s.userAgent}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.ipAddress} · {new Date(s.createdAt).toLocaleString()}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Expires {new Date(s.expiresAt).toLocaleString()}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                        {s.isCurrent && <span className="badge green">Current</span>}
                        {!s.isCurrent && (
                          <button className="icon-button" style={{ width: 30, height: 30, color: "var(--accent-red)" }} onClick={() => revokeSession(s.id)} title="Revoke session" aria-label="Revoke session"><X size={14} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <button className="button secondary" style={{ justifyContent: "center" }} onClick={revokeAllSessions}>
                  <LogOut size={16} /> Sign out all other devices
                </button>
                <button className="button danger" style={{ justifyContent: "center" }} onClick={() => { localStorage.clear(); navigate("/login"); }}>
                  <LogOut size={16} /> Sign out this device
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
