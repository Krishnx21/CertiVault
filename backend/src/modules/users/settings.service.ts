/**
 * Settings Service - Handles user profile and account settings
 */

import { User } from "./user.model.js";
import { RefreshSession } from "../auth/refreshSession.model.js";
import { ApiError } from "../../utils/ApiError.js";
import bcrypt from "bcryptjs";
import { getEnv } from "../../config/env.js";

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-passwordHash -mfaSecret -mfaBackupCodes");
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    provider: user.provider,
    createdAt: user.createdAt,
    notificationPreferences: user.notificationPreferences,
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, data: {
  name?: string;
  bio?: string;
  avatar?: string;
}) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (data.name) {
    if (data.name.length < 1 || data.name.length > 100) {
      throw new ApiError(400, "INVALID_NAME", "Name must be between 1 and 100 characters");
    }
    user.name = data.name;
  }

  if (data.bio !== undefined) {
    if (data.bio.length > 500) {
      throw new ApiError(400, "INVALID_BIO", "Bio cannot exceed 500 characters");
    }
    user.bio = data.bio;
  }

  if (data.avatar !== undefined) {
    user.avatar = data.avatar;
  }

  await user.save();

  return {
    id: user._id,
   name: user.name,
    bio: user.bio,
    avatar: user.avatar,
  };
};

/**
 * Change password
 */
export const changePassword = async (userId: string, data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const user = await User.findById(userId).select("+passwordHash");
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(data.currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "INVALID_PASSWORD", "Current password is incorrect");
  }

  // Validate new password
  if (data.newPassword.length < 8) {
    throw new ApiError(400, "INVALID_PASSWORD", "New password must be at least 8 characters");
  }

  // Update password
  user.passwordHash = data.newPassword;
  await user.save();

  return { success: true, message: "Password changed successfully" };
};

/**
 * Update email
 */
export const updateEmail = async (userId: string, data: {
  newEmail: string;
  password: string;
}) => {
  const user = await User.findById(userId).select("+passwordHash");
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "INVALID_PASSWORD", "Password is incorrect");
  }

  // Check if email is already taken
  const existingUser = await User.findOne({ email: data.newEmail.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, "EMAIL_EXISTS", "Email is already in use");
  }

  // Update email and mark as unverified
  user.email = data.newEmail.toLowerCase();
  user.isEmailVerified = false;
  
  // Generate email verification token
  const crypto = await import("crypto");
  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await user.save();

  // TODO: Send verification email

  return {
    success: true,
    message: "Email updated. Please verify your new email address.",
    email: user.email,
  };
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (userId: string, preferences: {
  emailNotifications?: boolean;
  documentShared?: boolean;
  documentVerified?: boolean;
  expiryReminders?: boolean;
  teamUpdates?: boolean;
}) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (preferences.emailNotifications !== undefined) {
    user.notificationPreferences.emailNotifications = preferences.emailNotifications;
  }
  if (preferences.documentShared !== undefined) {
    user.notificationPreferences.documentShared = preferences.documentShared;
  }
  if (preferences.documentVerified !== undefined) {
    user.notificationPreferences.documentVerified = preferences.documentVerified;
  }
  if (preferences.expiryReminders !== undefined) {
    user.notificationPreferences.expiryReminders = preferences.expiryReminders;
  }
  if (preferences.teamUpdates !== undefined) {
    user.notificationPreferences.teamUpdates = preferences.teamUpdates;
  }

  await user.save();

  return user.notificationPreferences;
};

/**
 * Delete account
 */
export const deleteAccount = async (userId: string, data: {
  password: string;
  confirmation: string;
}) => {
  const user = await User.findById(userId).select("+passwordHash");
  
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "INVALID_PASSWORD", "Password is incorrect");
  }

  // Verify confirmation
  if (data.confirmation !== "DELETE") {
    throw new ApiError(400, "INVALID_CONFIRMATION", "Please type DELETE to confirm");
  }

  // Soft delete by deactivating account
  user.isActive = false;
  user.email = `deleted_${user._id}@certi-vault.com`;
  user.name = "Deleted User";
  user.avatar = undefined;
  user.bio = undefined;
  
  await user.save();

  return { success: true, message: "Account deleted successfully" };
};

/**
 * Generate initials avatar
 */
export const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  // Generate a consistent color based on name
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="hsl(${hue}, 70%, 60%)"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `)}`;
};

/**
 * Get user sessions
 */
export const getUserSessions = async (userId: string) => {
  const sessions = await RefreshSession.findValidForUser(userId as any);
  
  return sessions.map((session) => ({
    id: session._id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    isCurrent: false, // Will be determined by comparing with current token
  }));
};

/**
 * Revoke all sessions except current
 */
export const revokeAllSessions = async (userId: string, currentSessionId?: string) => {
  const sessions = await RefreshSession.findValidForUser(userId as any);
  
  for (const session of sessions) {
    if (currentSessionId && session._id.toString() === currentSessionId) {
      continue; // Skip current session
    }
    await session.revoke();
  }
  
  return { success: true, message: "All sessions revoked" };
};

/**
 * Revoke specific session
 */
export const revokeSession = async (userId: string, sessionId: string) => {
  const session = await RefreshSession.findById(sessionId);
  
  if (!session) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }
  
  if (session.userId.toString() !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You can only revoke your own sessions");
  }
  
  await session.revoke();
  
  return { success: true, message: "Session revoked" };
};
