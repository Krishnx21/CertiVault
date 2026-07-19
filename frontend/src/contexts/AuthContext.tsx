/**
 * Authentication Context
 * Manages authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  setUser: (user: User) => void;
  setAccessToken: (token: string | null) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );

  const isAuthenticated = !!user;

  // Fetch current user
  const getCurrentUser = useCallback(async (): Promise<User> => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token");
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch user");
    }

    const data = await response.json();
    return data.data;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (accessToken) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        localStorage.removeItem("accessToken");
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [accessToken, getCurrentUser]);

  // Token refresh logic
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newAccessToken = data.data.accessToken;
      
      localStorage.setItem("accessToken", newAccessToken);
      setAccessToken(newAccessToken);

      // Fetch updated user data
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Token refresh failed:", error);
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);
      throw error;
    }
  }, [getCurrentUser]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Auto token refresh failed:", error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Login failed");
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;
    
    localStorage.setItem("accessToken", newAccessToken);
    setAccessToken(newAccessToken);
    setUser(data.data.user);
  }, []);

  // Register
  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Registration failed");
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;
    
    localStorage.setItem("accessToken", newAccessToken);
    setAccessToken(newAccessToken);
    setUser(data.data.user);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to send reset email");
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (token: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to reset password");
    }
  }, []);

  // Verify email
  const verifyEmail = useCallback(async (token: string) => {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to verify email");
    }

    // Refresh user data after verification
    if (user) {
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    }
  }, [user, getCurrentUser]);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to change password");
    }

    // Logout after password change (security best practice)
    await logout();
  }, [logout]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to resend verification email");
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    setUser,
    setAccessToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    changePassword,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
