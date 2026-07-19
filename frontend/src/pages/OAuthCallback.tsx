/**
 * OAuth Callback Page
 * Handles OAuth callback from Google and other providers
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCurrentUser, setUser, setAccessToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        navigate("/login?error=oauth_failed");
        return;
      }

      if (!token) {
        navigate("/login?error=no_token");
        return;
      }

      // Store the access token
      console.log("OAuthCallback: Storing token:", !!token);
      localStorage.setItem("accessToken", token);
      setAccessToken(token);

      // Fetch the authenticated user
      try {
        const userData = await getCurrentUser();
        console.log("OAuthCallback: User fetched successfully:", !!userData);
        setUser(userData);
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to fetch user after OAuth:", error);
        localStorage.removeItem("accessToken");
        setAccessToken(null);
        navigate("/login?error=user_fetch_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate, getCurrentUser, setUser, setAccessToken]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <div className="spinner" aria-label="Completing authentication…" />
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Completing authentication…</p>
    </div>
  );
};

export default OAuthCallback;
