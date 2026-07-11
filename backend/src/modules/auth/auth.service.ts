/**
 * Authentication Service
 * Business logic for authentication operations
 */

import { User } from "../users/user.model.js";
import { RefreshSession } from "./refreshSession.model.js";
import {
  generateTokenPair,
  hashRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  calculateTokenExpiration,
  type TokenPair,
} from "../../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../../common/utils/email.js";
import { ApiError } from "../../utils/ApiError.js";
import { getEnv } from "../../config/env.js";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    isEmailVerified: boolean;
  };
  tokens: TokenPair;
}

/**
 * Register a new user
 */
export const register = async (
  input: RegisterInput,
  ipAddress: string,
  userAgent: string
): Promise<AuthResult> => {
  // Validate password strength
  if (input.password.length < 8) {
    throw new ApiError(400, "INVALID_PASSWORD", "Password must be at least 8 characters long");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists");
  }

  // Create user
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash: input.password,
    name: input.name,
    provider: "local",
  });

  // Generate email verification token
  const verificationToken = generateEmailVerificationToken();
  const verificationExpires = calculateTokenExpiration("24h");

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Don't throw error - registration should succeed even if email fails
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Store refresh token session
  const tokenHash = hashRefreshToken(tokens.refreshToken);
  const refreshExpires = calculateTokenExpiration(getEnv().JWT_REFRESH_EXPIRES_IN);

  await RefreshSession.create({
    userId: user._id,
    tokenHash,
    userAgent,
    ipAddress,
    expiresAt: refreshExpires,
  });

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || undefined,
      isEmailVerified: user.isEmailVerified,
    },
    tokens,
  };
};

/**
 * Login user
 */
export const login = async (
  input: LoginInput,
  ipAddress: string,
  userAgent: string
): Promise<AuthResult> => {
  // Find user
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    "+passwordHash +isActive +failedLoginAttempts +lockedUntil"
  );

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new ApiError(423, "ACCOUNT_LOCKED", "Account is temporarily locked due to too many failed attempts. Please try again later.");
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(401, "ACCOUNT_DEACTIVATED", "Your account has been deactivated. Please contact support.");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    // Increment failed login attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    
    await user.save();
    
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Reset failed login attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Store refresh token session
  const tokenHash = hashRefreshToken(tokens.refreshToken);
  const refreshExpires = calculateTokenExpiration(getEnv().JWT_REFRESH_EXPIRES_IN);

  await RefreshSession.create({
    userId: user._id,
    tokenHash,
    userAgent,
    ipAddress,
    expiresAt: refreshExpires,
  });

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || undefined,
      isEmailVerified: user.isEmailVerified,
    },
    tokens,
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string,
  ipAddress: string,
  userAgent: string
): Promise<TokenPair> => {
  const tokenHash = hashRefreshToken(refreshToken);

  // Find valid session
  const session = await RefreshSession.findByTokenHash(tokenHash);
  
  if (!session) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
  }

  // Check if session is expired
  if (session.isExpired()) {
    throw new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }

  // Check if session is revoked
  if (session.isRevoked()) {
    throw new ApiError(401, "REFRESH_TOKEN_REVOKED", "Refresh token has been revoked");
  }

  // Get user
  const user = await User.findById(session.userId).select("+isActive");
  
  if (!user || !user.isActive) {
    // Revoke session if user no longer exists or is inactive
    await session.revoke();
    throw new ApiError(401, "USER_INACTIVE", "User no longer exists or account is inactive");
  }

  // Revoke old session (token rotation)
  await session.revoke();

  // Generate new tokens
  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Create new session
  const newTokenHash = hashRefreshToken(tokens.refreshToken);
  const refreshExpires = calculateTokenExpiration(getEnv().JWT_REFRESH_EXPIRES_IN);

  await RefreshSession.create({
    userId: user._id,
    tokenHash: newTokenHash,
    userAgent,
    ipAddress,
    expiresAt: refreshExpires,
  });

  return tokens;
};

/**
 * Logout user
 */
export const logout = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashRefreshToken(refreshToken);
  
  const session = await RefreshSession.findByTokenHash(tokenHash);
  
  if (session) {
    await session.revoke();
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (userId: string): Promise<void> => {
  await RefreshSession.deleteAllForUser(userId as any);
};

/**
 * Get current user
 */
export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar || undefined,
    bio: user.bio || undefined,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
};

/**
 * Forgot password
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // Don't reveal if user exists or not
  if (!user) {
    return;
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  const resetExpires = calculateTokenExpiration("1h");

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // Send password reset email
  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Don't throw error - security best practice
  }
};

/**
 * Reset password
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  // Validate password strength
  if (newPassword.length < 8) {
    throw new ApiError(400, "INVALID_PASSWORD", "Password must be at least 8 characters long");
  }

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "INVALID_TOKEN", "Invalid or expired reset token");
  }

  // Update password
  user.passwordHash = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Logout from all devices
  await RefreshSession.deleteAllForUser(user._id);
};

/**
 * Verify email
 */
export const verifyEmail = async (token: string): Promise<void> => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new ApiError(400, "INVALID_TOKEN", "Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Validate new password strength
  if (newPassword.length < 8) {
    throw new ApiError(400, "INVALID_PASSWORD", "Password must be at least 8 characters long");
  }

  const user = await User.findById(userId).select("+passwordHash");
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "INVALID_PASSWORD", "Current password is incorrect");
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Logout from all devices (security best practice)
  await RefreshSession.deleteAllForUser(user._id);
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "EMAIL_ALREADY_VERIFIED", "Email is already verified");
  }

  // Generate new verification token
  const verificationToken = generateEmailVerificationToken();
  const verificationExpires = calculateTokenExpiration("24h");

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new ApiError(500, "EMAIL_SEND_FAILED", "Failed to send verification email");
  }
};
