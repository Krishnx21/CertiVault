import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FileClock,
  Files,
  HardDrive,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api } from "./api.js";
import { Document, Summary } from "./types.js";
import { Sidebar } from "./components/Sidebar.js";
import { Topbar } from "./components/Topbar.js";
import { StatCard } from "./components/StatCard.js";
import { DocumentTable } from "./components/DocumentTable.js";
import { UploadModal } from "./components/UploadModal.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, storageBytes: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const load = useCallback(async () => {
    try {
      const [documentResponse, summaryResponse] = await Promise.all([
        api.getDocuments(search, status),
        api.getSummary(),
      ]);
      setDocuments(documentResponse.data);
      setSummary(summaryResponse.data);
    } catch {
      setToast("Backend is unavailable. Start the API on port 5000.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 180);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshAfterUpload = async () => {
    setUploadOpen(false);
    setToast("Document uploaded and checksum created.");
    await load();
  };

  const verify = async (id: string) => {
    await api.verifyDocument(id);
    setToast("Document verified successfully.");
    await load();
  };

  const remove = async (id: string) => {
    await api.deleteDocument(id);
    setToast("Document removed from the workspace.");
    await load();
  };

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
        <Topbar search={search} setSearch={setSearch} setMobileNav={setMobileNav} />
        <div className="content">
          <section className="hero-row">
            <div>
              <p className="eyebrow">DOCUMENT COMMAND CENTER</p>
              <h1>Good morning, Krishna.</h1>
              <p>Here’s what’s happening across your secure workspace.</p>
            </div>
            <button
              className="button primary upload-button"
              onClick={() => setUploadOpen(true)}
            >
              <Upload size={18} /> Upload document
            </button>
          </section>

          <section className="stats-grid">
            <StatCard
              icon={Files}
              label="Total documents"
              value={summary.total}
              note="Across your workspace"
              tone="blue"
            />
            <StatCard
              icon={CheckCircle2}
              label="Verified"
              value={summary.verified}
              note={`${
                summary.total
                  ? Math.round((summary.verified / summary.total) * 100)
                  : 0
              }% verification rate`}
              tone="green"
            />
            <StatCard
              icon={FileClock}
              label="Pending review"
              value={summary.pending}
              note="Requires attention"
              tone="amber"
            />
            <StatCard
              icon={HardDrive}
              label="Secure storage"
              value={formatBytes(summary.storageBytes)}
              note="Encrypted at rest"
              tone="violet"
            />
          </section>

          <DocumentTable
            documents={documents}
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            loading={loading}
            onVerify={verify}
            onDelete={remove}
          />

          <footer>
            <span>
              <ShieldCheck size={15} /> Protected by CertiVault integrity controls
            </span>
            <span>ECSoC 2026 · Project Admin</span>
          </footer>
        </div>
      </main>
      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refreshAfterUpload} />
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
