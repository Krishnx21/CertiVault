/**
 * Authentication Routes
 * Route definitions and validation schemas for auth endpoints
 */

import { Router } from "express";
import { z } from "zod";
import passport from "../../config/passport.js";
import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  logoutAllController,
  getCurrentUserController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  changePasswordController,
  resendVerificationEmailController,
} from "./auth.controller.js";
import { protect } from "../../middleware/auth.js";
import { generateTokenPair, hashRefreshToken, calculateTokenExpiration } from "../../utils/jwt.js";
import { RefreshSession } from "./refreshSession.model.js";
import { getEnv } from "../../config/env.js";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: errors,
        },
      });
    }
    
    next();
  };
};

// Public routes
router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", validate(refreshTokenSchema), refreshTokenController);
router.post("/logout", logoutController);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmailController);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerificationEmailController);

// Protected routes
router.post("/logout-all", protect, logoutAllController);
router.get("/me", protect, getCurrentUserController);
router.post("/change-password", protect, validate(changePasswordSchema), changePasswordController);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req: any, res: any) => {
    try {
      const user = req.user;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
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

      // Set HTTP-only cookie for refresh token
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Redirect to frontend with access token
      const frontendUrl = `${getEnv().FRONTEND_ORIGIN}/auth/callback?token=${tokens.accessToken}&expiresIn=${tokens.expiresIn}`;
      res.redirect(frontendUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${getEnv().FRONTEND_ORIGIN}/login?error=oauth_failed`);
    }
  }
);

export { router as authRouter };
