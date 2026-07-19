import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(16,185,129,.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={32} color="var(--accent-green)" />
          </div>
          <h1 style={{ marginBottom: "0.5rem" }}>Check your email</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
            We sent a reset link to <strong>{email}</strong>. It expires in 1 hour.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button onClick={() => navigate("/login")} className="button primary"
              style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
              Back to login
            </button>
            <button onClick={() => { setIsSuccess(false); setEmail(""); }} className="button ghost"
              style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
              Try another email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldCheck size={26} /></div>
          <h1>Forgot password?</h1>
          <p>We'll send a reset link to your email</p>
        </div>

        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          <ArrowLeft size={15} aria-hidden="true" /> Back to login
        </Link>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field-label">
            <span>Email address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} aria-hidden="true" />
              <input id="email" name="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="auth-input" placeholder="you@example.com" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="button primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", minHeight: "44px" }}>
            {isLoading ? (
              <><div className="spinner spinner-sm" aria-hidden="true" />Sending…</>
            ) : "Send reset link"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
