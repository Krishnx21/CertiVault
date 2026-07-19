/**
 * Settings Controller - Handles user settings HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import {
  getUserProfile,
  updateProfile,
  changePassword,
  updateEmail,
  updateNotificationPreferences,
  deleteAccount,
  generateInitialsAvatar,
  getUserSessions,
  revokeAllSessions,
  revokeSession,
} from "./settings.service.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Get user profile
 */
export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const profile = await getUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { name, bio, avatar } = req.body;

    const updatedProfile = await updateProfile(userId, { name, bio, avatar });

    res.json({
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, "MISSING_FIELDS", "Current password and new password are required"));
    }

    const result = await changePassword(userId, { currentPassword, newPassword });

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update email
 */
export const updateEmailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return next(new ApiError(400, "MISSING_FIELDS", "New email and password are required"));
    }

    const result = await updateEmail(userId, { newEmail, password });

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferencesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const preferences = req.body;

    const updatedPreferences = await updateNotificationPreferences(userId, preferences);

    res.json({
      success: true,
      data: updatedPreferences,
      message: "Notification preferences updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete account
 */
export const deleteAccountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { password, confirmation } = req.body;

    if (!password || !confirmation) {
      return next(new ApiError(400, "MISSING_FIELDS", "Password and confirmation are required"));
    }

    const result = await deleteAccount(userId, { password, confirmation });

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate initials avatar
 */
export const generateAvatarController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return next(new ApiError(400, "MISSING_NAME", "Name is required"));
    }

    const avatarUrl = generateInitialsAvatar(name);

    res.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user sessions
 */
export const getSessionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const sessions = await getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all sessions
 */
export const revokeAllSessionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { currentSessionId } = req.body;

    const result = await revokeAllSessions(userId, currentSessionId);

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke specific session
 */
export const revokeSessionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const { sessionId } = req.params;
    const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    const result = await revokeSession(userId, sessionIdStr);

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
