/**
 * Authentication Middleware
 * Protects routes by verifying JWT access tokens
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../modules/users/user.model.js";
import { RefreshSession } from "../modules/auth/refreshSession.model.js";
import { ApiError } from "../utils/ApiError.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

/**
 * Protect route - verify JWT access token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "NO_TOKEN", "No token provided. Please log in.");
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select("+isActive");
    
    if (!user) {
      throw new ApiError(401, "USER_NOT_FOUND", "User no longer exists. Please log in again.");
    }
    
    if (!user.isActive) {
      throw new ApiError(401, "ACCOUNT_LOCKED", "Your account has been deactivated. Please contact support.");
    }
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token. Please log in again.",
      },
    });
  }
};

/**
 * Authorize based on user role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
        },
      });
      return;
    }
    
    next();
  };
};

/**
 * Optional auth - attach user if token exists, but don't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId).select("+isActive");
    
    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name ?? "",
        role: decoded.role,
      };
    }
    
    next();
  } catch {
    // If token is invalid, just continue without user
    next();
  }
};

/**
 * Verify email required
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
    return;
  }
  
  // We need to fetch the user to check email verification
  User.findById(req.user.userId)
    .then(user => {
      if (!user || !user.isEmailVerified) {
        res.status(403).json({
          success: false,
          error: {
            code: "EMAIL_NOT_VERIFIED",
            message: "Please verify your email address to access this feature.",
          },
        });
        return;
      }
      next();
    })
    .catch(() => {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while verifying your email status.",
        },
      });
    });
};
