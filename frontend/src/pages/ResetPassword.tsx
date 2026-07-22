import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Lock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) setError("Invalid or missing reset token");
    else setToken(t);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const pwReqs = [
    { label: "At least 8 characters",   met: formData.password.length >= 8 },
    { label: "One uppercase letter",     met: /[A-Z]/.test(formData.password) },
    { label: "One lowercase letter",     met: /[a-z]/.test(formData.password) },
    { label: "One number",               met: /[0-9]/.test(formData.password) },
    { label: "One special character",    met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const validate = (pw: string) => {
    if (pw.length < 8)            return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw))        return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(pw))        return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(pw))        return "Must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pw)) return "Must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Invalid reset token"); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    const err = validate(formData.password);
    if (err) { setError(err); return; }
    setIsLoading(true);
    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
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
          <h1 style={{ marginBottom: "0.5rem" }}>Password reset!</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
            Your password has been updated. You can now log in with your new credentials.
          </p>
          <button onClick={() => navigate("/login")} className="button primary"
            style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldCheck size={26} /></div>
          <h1>Reset password</h1>
          <p>Enter your new password below</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field-label">
            <span>New password</span>
            <div className="auth-input-wrapper">
              <Lock size={16} aria-hidden="true" />
              <input id="password" name="password" type="password" autoComplete="new-password" required
                value={formData.password} onChange={handleChange}
                className="auth-input" placeholder="••••••••" />
            </div>
            {formData.password && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.375rem" }}>
                {pwReqs.map((r) => (
                  <div key={r.label} className={`pw-req ${r.met ? "met" : ""}`}>
                    {r.met
                      ? <CheckCircle2 size={13} aria-hidden="true" />
                      : <div style={{ width: 13, height: 13, border: "1px solid var(--border-color)", borderRadius: "50%", flexShrink: 0 }} />
                    }
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field-label">
            <span>Confirm new password</span>
            <div className="auth-input-wrapper">
              <Lock size={16} aria-hidden="true" />
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                value={formData.confirmPassword} onChange={handleChange}
                className="auth-input"
                style={formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? { borderColor: "var(--accent-red)" } : {}}
                placeholder="••••••••" />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <span className="form-error">Passwords do not match</span>
            )}
          </div>

          <button type="submit" disabled={isLoading || !token} className="button primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", minHeight: "44px" }}>
            {isLoading ? (
              <><div className="spinner spinner-sm" aria-hidden="true" />Resetting…</>
            ) : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
