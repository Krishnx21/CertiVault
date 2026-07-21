/**
 * QR Code Generation Service
 * Generates secure QR codes for document verification
 */

import QRCode from "qrcode";
import crypto from "crypto";
import { getEnv } from "../../config/env.js";

const env = getEnv();

/**
 * Generate secure random verification token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate QR code for document verification
 */
export const generateQRCode = async (
  token: string,
  baseUrl?: string
): Promise<{ qrCodeUrl: string; verificationUrl: string }> => {
  const verificationBaseUrl = baseUrl || env.FRONTEND_ORIGIN;
  const verificationUrl = `${verificationBaseUrl}/public/verify/${token}`;

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  return {
    qrCodeUrl: qrCodeDataUrl,
    verificationUrl,
  };
};

/**
 * Generate QR code as buffer for download
 */
export const generateQRCodeBuffer = async (
  token: string,
  baseUrl?: string
): Promise<{ buffer: Buffer; verificationUrl: string }> => {
  const verificationBaseUrl = baseUrl || env.FRONTEND_ORIGIN;
  const verificationUrl = `${verificationBaseUrl}/public/verify/${token}`;

  // Generate QR code as buffer
  const buffer = await QRCode.toBuffer(verificationUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  return {
    buffer,
    verificationUrl,
  };
};

/**
 * Validate verification token format
 */
export const isValidVerificationToken = (token: string): boolean => {
  // Token should be 64 hex characters (32 bytes)
  return /^[a-f0-9]{64}$/.test(token);
};
