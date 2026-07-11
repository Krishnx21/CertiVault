import { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./contexts/AuthContext.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import ResetPassword from "./pages/ResetPassword.js";
import VerifyEmail from "./pages/VerifyEmail.js";
import { VerificationPage } from "./pages/Verification.js";
import { PublicVerifyPage } from "./pages/PublicVerify.js";

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, verified: 0, pending: 0, archived: 0, favorites: 0, storageBytes: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const [documentResponse, summaryResponse] = await Promise.all([
        api.getDocuments({ search, status, sortBy, page, limit: 20 }),
        api.getDocumentSummary(),
      ]);
      setDocuments(documentResponse.documents);
      setSummary(summaryResponse.data);
      setTotalPages(documentResponse.totalPages);
    } catch (error: any) {
      setToast(error.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshAfterUpload = async () => {
    setUploadOpen(false);
    setToast("Document uploaded successfully.");
    await load();
  };

  const verify = async (id: string) => {
    try {
      await api.verifyDocumentStatus(id, "verified");
      setToast("Document verified successfully.");
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to verify document");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setToast("Document removed from the workspace.");
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to delete document");
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await api.unfavoriteDocument(id);
        setToast("Removed from favorites");
      } else {
        await api.favoriteDocument(id);
        setToast("Added to favorites");
      }
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to update favorite");
    }
  };

  const archive = async (id: string) => {
    try {
      await api.archiveDocument(id);
      setToast("Document archived successfully.");
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to archive document");
    }
  };

  const restore = async (id: string) => {
    try {
      await api.restoreDocument(id);
      setToast("Document restored successfully.");
      await load();
    } catch (error: any) {
      setToast(error.message || "Failed to restore document");
    }
  };

  const viewVerification = (id: string) => {
    navigate(`/verification/${id}`);
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
              <p>Here's what's happening across your secure workspace.</p>
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
            onToggleFavorite={toggleFavorite}
            onArchive={archive}
            onRestore={restore}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onViewVerification={viewVerification}
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
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification/:documentId"
            element={
              <ProtectedRoute>
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/public/verify/:token" element={<PublicVerifyPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
