import { Request, Response, NextFunction } from "express";
import { getEnv } from "../config/env.js";

/**
 * CSRF Protection Middleware
 * Protects state-changing requests from cross-origin CSRF attacks by validating Origin and Referer headers.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Skip check for safe HTTP methods
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 2. Allow requests containing bearer token in Authorization header
  // Since CSRF attacks cannot set custom headers on cross-domain requests,
  // the presence of an Authorization header proves the request is safe.
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  // 3. Validate Origin / Referer
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  const env = getEnv();
  const allowedOrigins = [
    env.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
  ].filter(Boolean);

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (requestOrigin) {
    if (!allowedOrigins.includes(requestOrigin) && !requestOrigin.startsWith("http://localhost:") && !requestOrigin.startsWith("http://127.0.0.1:")) {
      res.status(403).json({
        success: false,
        error: {
          code: "CSRF_ERROR",
          message: "CSRF validation failed: Origin not allowed.",
        },
      });
      return;
    }
  }

  next();
};
