/**
 * Authentication Controller
 * HTTP request handlers for authentication endpoints
 */

import { Request, Response } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  resendVerificationEmail,
} from "./auth.service.js";

/**
 * Register new user
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const result = await register(
    { email, password, name },
    ipAddress,
    userAgent
  );

  // Set HTTP-only cookie for refresh token
  res.cookie("refreshToken", result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    },
  });
};

/**
 * Login user
 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const result = await login({ email, password }, ipAddress, userAgent);

  // Set HTTP-only cookie for refresh token
  res.cookie("refreshToken", result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    },
  });
};

/**
 * Refresh access token
 */
export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  const tokenValue = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!tokenValue) {
    res.status(401).json({
      success: false,
      error: {
        code: "NO_REFRESH_TOKEN",
        message: "Refresh token is required",
      },
    });
    return;
  }

  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const tokens = await refreshToken(tokenValue, ipAddress, userAgent);

  // Set new HTTP-only cookie for refresh token
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  res.status(200).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
  });
};

/**
 * Logout user
 */
export const logoutController = async (req: Request, res: Response): Promise<void> => {
  const tokenValue = req.cookies.refreshToken || req.body.refreshToken;

  if (tokenValue) {
    await logout(tokenValue);
  }

  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully",
    },
  });
};

/**
 * Logout from all devices
 */
export const logoutAllController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  await logoutAll(req.user.userId);

  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.status(200).json({
    success: true,
    data: {
      message: "Logged out from all devices successfully",
    },
  });
};

/**
 * Get current user
 */
export const getCurrentUserController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const user = await getCurrentUser(req.user.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};

/**
 * Forgot password
 */
export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  await forgotPassword(email);

  res.status(200).json({
    success: true,
    data: {
      message: "If an account exists with this email, a password reset link has been sent",
    },
  });
};

/**
 * Reset password
 */
export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  await resetPassword(token, password);

  res.status(200).json({
    success: true,
    data: {
      message: "Password has been reset successfully. Please login with your new password",
    },
  });
};

/**
 * Verify email
 */
export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  await verifyEmail(token);

  res.status(200).json({
    success: true,
    data: {
      message: "Email has been verified successfully",
    },
  });
};

/**
 * Change password (authenticated)
 */
export const changePasswordController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  await changePassword(req.user.userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    data: {
      message: "Password has been changed successfully. Please login again",
    },
  });
};

/**
 * Resend verification email
 */
export const resendVerificationEmailController = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  await resendVerificationEmail(email);

  res.status(200).json({
    success: true,
    data: {
      message: "Verification email has been sent",
    },
  });
};
