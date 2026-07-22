import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      setError("No verification token found in the link.");
    } else {
      setToken(t);
      handleVerify(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (t: string) => {
    setIsLoading(true);
    setError("");
    try {
      await verifyEmail(t);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Verification failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setIsResending(true);
    setError("");
    try {
      await resendVerificationEmail(resendEmail);
      setError("");
      setShowResendForm(false);
      alert("Verification email sent — check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(16,185,129,.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={32} color="var(--accent-green)" />
          </div>
          <h1 style={{ marginBottom: "0.5rem" }}>Email verified!</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
            Your email has been verified. You can now access all CertiVault features.
          </p>
          <button onClick={() => navigate("/dashboard")} className="button primary"
            style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldCheck size={26} /></div>
          <h1>Verify your email</h1>
          <p>{isLoading ? "Verifying your email address…" : "Please wait while we verify your email"}</p>
        </div>

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 0" }}>
            <div className="spinner" aria-label="Verifying…" />
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert" style={{ textAlign: "left" }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !token && !showResendForm && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Check your email for the verification link, or request a new one below.
          </p>
        )}

        {!isLoading && !isSuccess && (
          <>
            {showResendForm ? (
              <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "1rem" }}>
                <div className="field-label" style={{ textAlign: "left" }}>
                  <span>Your email address</span>
                  <div className="auth-input-wrapper">
                    <Mail size={16} aria-hidden="true" />
                    <input type="email" required value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="auth-input" placeholder="you@example.com" />
                  </div>
                </div>
                <button type="submit" disabled={isResending} className="button primary"
                  style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
                  {isResending
                    ? <><div className="spinner spinner-sm" aria-hidden="true" />Sending…</>
                    : <><RefreshCw size={16} />Resend verification</>}
                </button>
                <button type="button" className="button ghost"
                  style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
                  onClick={() => setShowResendForm(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                <button onClick={() => setShowResendForm(true)} className="button secondary"
                  style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
                  <RefreshCw size={16} />Resend verification email
                </button>
              </div>
            )}
          </>
        )}

        <button onClick={() => navigate("/login")} className="button ghost"
          style={{ width: "100%", justifyContent: "center", minHeight: "44px", marginTop: "0.75rem" }}>
          Back to login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
