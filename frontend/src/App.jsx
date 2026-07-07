import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, Check, CheckCircle2, ChevronDown, CloudUpload, FileCheck2, FileClock,
  Files, FolderOpen, HardDrive, LayoutDashboard, Menu, MoreHorizontal, Search,
  Settings, ShieldCheck, Sparkles, Trash2, Upload, UserRound, X,
} from "lucide-react";
import { api } from "./api.js";

const formatBytes = (bytes) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const relativeDate = (date) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date)) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={21} /></div>
    <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
  </article>;
}

function UploadModal({ onClose, onUploaded }) {
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Certificate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file) return setError("Choose a document first.");
    setBusy(true); setError("");
    const data = new FormData(); data.append("file", file); data.append("type", type);
    try { await api.uploadDocument(data); onUploaded(); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
      <div className="modal-heading"><div className="modal-mark"><CloudUpload /></div><div><h2>Upload document</h2><p>Add a file to your secure workspace.</p></div></div>
      <button className={`dropzone ${file ? "has-file" : ""}`} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" hidden onChange={(event) => setFile(event.target.files[0])} />
        {file ? <><FileCheck2 size={34} /><strong>{file.name}</strong><span>{formatBytes(file.size)} · Click to replace</span></> : <><Upload size={34} /><strong>Choose a file to upload</strong><span>PDF, image, or document · Up to 10 MB</span></>}
      </button>
      <label className="field-label">Document type<select value={type} onChange={(event) => setType(event.target.value)}><option>Certificate</option><option>Contract</option><option>Identity</option><option>Financial</option><option>Other</option></select></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" onClick={submit} disabled={busy}>{busy ? "Securing…" : "Upload securely"}</button></div>
    </div>
  </div>;
}

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, verified: 0, pending: 0, storageBytes: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const load = useCallback(async () => {
    try {
      const [documentResponse, summaryResponse] = await Promise.all([api.getDocuments(search, status), api.getSummary()]);
      setDocuments(documentResponse.data); setSummary(summaryResponse.data);
    } catch { setToast("Backend is unavailable. Start the API on port 5000."); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const timer = setTimeout(load, 180); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);

  const refreshAfterUpload = async () => { setUploadOpen(false); setToast("Document uploaded and checksum created."); await load(); };
  const verify = async (id) => { await api.verifyDocument(id); setToast("Document verified successfully."); await load(); };
  const remove = async (id) => { await api.deleteDocument(id); setToast("Document removed from the workspace."); await load(); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><ShieldCheck /></div><div><strong>CertiVault</strong><span>Document trust</span></div></div>
      <nav><p>Workspace</p><a className="active"><LayoutDashboard /> Dashboard</a><a><Files /> Documents <span className="nav-count">{summary.total}</span></a><a><FileCheck2 /> Verification <span className="nav-count amber">{summary.pending}</span></a><a><FolderOpen /> Shared vaults</a><p>Manage</p><a><UserRound /> Team members</a><a><Settings /> Settings</a></nav>
      <div className="trust-card"><div className="trust-icon"><Sparkles size={18} /></div><strong>Trust center</strong><p>Your workspace is protected and all files are integrity checked.</p><span><Check size={13} /> Systems operational</span></div>
      <div className="sidebar-user"><div className="avatar">KK</div><div><strong>Krishna Kumar</strong><span>Project Admin</span></div><MoreHorizontal size={18} /></div>
    </aside>
    {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
    <main>
      <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNav(true)}><Menu /></button><div className="global-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents, tags, or owners…" /><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-button notification"><Bell size={19} /><i /></button><button className="profile"><div className="avatar small">KK</div><span>Krishna</span><ChevronDown size={15} /></button></div></header>
      <div className="content">
        <section className="hero-row"><div><p className="eyebrow">DOCUMENT COMMAND CENTER</p><h1>Good morning, Krishna.</h1><p>Here’s what’s happening across your secure workspace.</p></div><button className="button primary upload-button" onClick={() => setUploadOpen(true)}><Upload size={18} /> Upload document</button></section>
        <section className="stats-grid"><StatCard icon={Files} label="Total documents" value={summary.total} note="Across your workspace" tone="blue" /><StatCard icon={CheckCircle2} label="Verified" value={summary.verified} note={`${summary.total ? Math.round(summary.verified / summary.total * 100) : 0}% verification rate`} tone="green" /><StatCard icon={FileClock} label="Pending review" value={summary.pending} note="Requires attention" tone="amber" /><StatCard icon={HardDrive} label="Secure storage" value={formatBytes(summary.storageBytes)} note="Encrypted at rest" tone="violet" /></section>
        <section className="documents-panel"><div className="panel-head"><div><h2>Recent documents</h2><p>Manage and verify files in your workspace.</p></div><div className="panel-tools"><div className="table-search"><Search size={16} /><input aria-label="Search documents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" /></div><select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="verified">Verified</option><option value="pending">Pending</option></select></div></div>
          <div className="table-wrap"><table><thead><tr><th>Document</th><th>Type</th><th>Status</th><th>Owner</th><th>Added</th><th></th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id}><td><div className="document-cell"><div className="file-icon">{doc.name.split(".").pop().toUpperCase().slice(0, 3)}</div><div><strong>{doc.name}</strong><span>{formatBytes(doc.size)} · ID {doc.checksum.slice(0, 8)}</span></div></div></td><td><span className="type-chip">{doc.type}</span></td><td><span className={`status ${doc.status}`}><i />{doc.status}</span></td><td><div className="owner"><div className="avatar tiny">KK</div>{doc.owner}</div></td><td>{relativeDate(doc.createdAt)}</td><td><div className="row-actions">{doc.status === "pending" && <button onClick={() => verify(doc.id)} title="Verify"><ShieldCheck size={17} /></button>}<button onClick={() => remove(doc.id)} title="Delete"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table>{loading && <div className="empty-state">Loading secure workspace…</div>}{!loading && !documents.length && <div className="empty-state"><Files size={32} /><strong>No documents found</strong><span>Try another search or upload a new document.</span></div>}</div>
        </section>
        <footer><span><ShieldCheck size={15} /> Protected by CertiVault integrity controls</span><span>ECSoC 2026 · Project Admin</span></footer>
      </div>
    </main>
    {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refreshAfterUpload} />}
    {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
  </div>;
}
