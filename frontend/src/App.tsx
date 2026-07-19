import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import ResetPassword from "./pages/ResetPassword.js";
import VerifyEmail from "./pages/VerifyEmail.js";
import { VerificationPage } from "./pages/Verification.js";
import { PublicVerifyPage } from "./pages/PublicVerify.js";
import OAuthCallback from "./pages/OAuthCallback.js";
import Dashboard from "./pages/Dashboard.js";
import Documents from "./pages/Documents.js";
import DocumentDetail from "./pages/DocumentDetail.js";
import Verifications from "./pages/Verifications.js";
import SharedVaults from "./pages/SharedVaults.js";          // UPDATED
import VaultMembers from "./pages/VaultMembers.js";           // UPDATED
import SharedVaultDocuments from "./pages/SharedVaultDocuments.js"; // UPDATED
import Settings from "./pages/Settings.js";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <Verifications />
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
          <Route
            path="/shared-vaults"
            element={<Navigate to="/vault/shared" replace />}
          />
          <Route
            path="/team-members"
            element={<Navigate to="/vault/members" replace />}
          />
          <Route
            path="/vault/shared"
            element={
              <ProtectedRoute>
                <SharedVaults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault/shared/:ownerId/documents"
            element={
              <ProtectedRoute>
                <SharedVaultDocuments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault/members"
            element={
              <ProtectedRoute>
                <VaultMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
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
