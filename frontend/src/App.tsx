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
import SharedVaults from "./pages/SharedVaults.js";
import TeamMembers from "./pages/TeamMembers.js";
import Settings from "./pages/Settings.js";

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
            element={
              <ProtectedRoute>
                <SharedVaults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-members"
            element={
              <ProtectedRoute>
                <TeamMembers />
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
