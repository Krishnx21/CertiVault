/**
 * JWT Utilities - Token generation and verification
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getEnv } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, "iat" | "exp">): string => {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash refresh token for storage
 */
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: Omit<TokenPayload, "iat" | "exp">): TokenPair => {
  const env = getEnv();
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();
  
  // Calculate expiresIn in seconds
  const expiresInMatch = env.JWT_ACCESS_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  let expiresIn = 900; // default 15 minutes
  if (expiresInMatch) {
    const value = parseInt(expiresInMatch[1]);
    const unit = expiresInMatch[2];
    switch (unit) {
      case "s": expiresIn = value; break;
      case "m": expiresIn = value * 60; break;
      case "h": expiresIn = value * 3600; break;
      case "d": expiresIn = value * 86400; break;
    }
  }
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const env = getEnv();
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Calculate token expiration date
 */
export const calculateTokenExpiration = (expiresIn: string): Date => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    return new Date(now.getTime() + 15 * 60 * 1000); // default 15 minutes
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case "s":
      return new Date(now.getTime() + value * 1000);
    case "m":
      return new Date(now.getTime() + value * 60 * 1000);
    case "h":
      return new Date(now.getTime() + value * 3600 * 1000);
    case "d":
      return new Date(now.getTime() + value * 24 * 3600 * 1000);
    default:
      return new Date(now.getTime() + 15 * 60 * 1000);
  }
};
