import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const pwReqs = [
    { label: "At least 8 characters",        met: formData.password.length >= 8 },
    { label: "One uppercase letter",          met: /[A-Z]/.test(formData.password) },
    { label: "One lowercase letter",          met: /[a-z]/.test(formData.password) },
    { label: "One number",                    met: /[0-9]/.test(formData.password) },
    { label: "One special character",         met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const validatePassword = (pw: string) => {
    if (pw.length < 8)              return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw))          return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(pw))          return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(pw))          return "Must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pw))   return "Must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    const pwErr = validatePassword(formData.password);
    if (pwErr) { setError(pwErr); return; }
    setIsLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldCheck size={26} /></div>
          <h1>Create account</h1>
          <p>Join CertiVault today</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field-label">
            <span>Full name</span>
            <div className="auth-input-wrapper">
              <User size={16} aria-hidden="true" />
              <input id="name" name="name" type="text" autoComplete="name" required
                value={formData.name} onChange={handleChange}
                className="auth-input" placeholder="John Doe" />
            </div>
          </div>

          <div className="field-label">
            <span>Email address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} aria-hidden="true" />
              <input id="email" name="email" type="email" autoComplete="email" required
                value={formData.email} onChange={handleChange}
                className="auth-input" placeholder="you@example.com" />
            </div>
          </div>

          <div className="field-label">
            <span>Password</span>
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
            <span>Confirm password</span>
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

          <button type="submit" disabled={isLoading} className="button primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", minHeight: "44px" }}>
            {isLoading ? (
              <><div className="spinner spinner-sm" aria-hidden="true" />Creating account…</>
            ) : (
              <><UserPlus size={17} aria-hidden="true" />Create account</>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
