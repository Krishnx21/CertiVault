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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
