import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <ShieldCheck size={26} />
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your CertiVault account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field-label">
            <span>Email address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="field-label">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Password</span>
              <Link
                to="/forgot-password"
                style={{ fontSize: "0.8125rem", color: "var(--accent-blue)" }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="remember"
              type="checkbox"
              style={{ width: "16px", height: "16px", accentColor: "var(--accent-blue)", cursor: "pointer" }}
            />
            <label htmlFor="remember" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="button primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", minHeight: "44px" }}
          >
            {isLoading ? (
              <>
                <div className="spinner spinner-sm" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={17} aria-hidden="true" />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">Or continue with</div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="button ghost"
          style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Footer link */}
        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent-blue)", fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
