/**
 * Email Service - Resend Integration
 */

import { Resend } from "resend";
import { getEnv } from "../../config/env.js";

// Lazy singleton — only instantiated when a key is present.
// Calling new Resend("") throws immediately, so we must not create
// the client at module load time if the key is absent.
let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const key = getEnv().RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string
): Promise<void> => {
  const env = getEnv();
  const verificationUrl = `${env.FRONTEND_ORIGIN}/verify-email?token=${verificationToken}`;
  
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log("Skipping email send (RESEND_API_KEY not configured):", {
        to: email,
        type: "verification",
        url: verificationUrl,
      });
      return;
    }

    await resend.emails.send({
      from: env.EMAIL_FROM || "CertiVault <noreply@certivault.com>",
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9fafb;
                border-radius: 8px;
                padding: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #1e40af;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">CertiVault</div>
              </div>
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hi ${name},</p>
                <p>Thank you for signing up for CertiVault. Please verify your email address by clicking the button below:</p>
                <p>
                  <a href="${verificationUrl}" class="button">Verify Email</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CertiVault. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const env = getEnv();
  const resetUrl = `${env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
  
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log("Skipping email send (RESEND_API_KEY not configured):", {
        to: email,
        type: "password-reset",
        url: resetUrl,
      });
      return;
    }

    await resend.emails.send({
      from: env.EMAIL_FROM || "CertiVault <noreply@certivault.com>",
      to: email,
      subject: "Reset Your Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9fafb;
                border-radius: 8px;
                padding: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #1e40af;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
              }
              .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">CertiVault</div>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <p>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #1e40af;">${resetUrl}</p>
                <div class="warning">
                  <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CertiVault. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const env = getEnv();
  
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log("Skipping email send (RESEND_API_KEY not configured):", {
        to: email,
        type: "welcome",
      });
      return;
    }

    await resend.emails.send({
      from: env.EMAIL_FROM || "CertiVault <noreply@certivault.com>",
      to: email,
      subject: "Welcome to CertiVault",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CertiVault</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9fafb;
                border-radius: 8px;
                padding: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #1e40af;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">CertiVault</div>
              </div>
              <div class="content">
                <h2>Welcome to CertiVault! 🎉</h2>
                <p>Hi ${name},</p>
                <p>Welcome to CertiVault - your secure document management and verification platform.</p>
                <p>You can now:</p>
                <ul>
                  <li>Upload and manage your documents securely</li>
                  <li>Verify document authenticity with QR codes</li>
                  <li>Share documents with team members</li>
                  <li>Track document activity and history</li>
                </ul>
                <p>
                  <a href="${env.FRONTEND_ORIGIN}/dashboard" class="button">Go to Dashboard</a>
                </p>
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  If you have any questions, feel free to reach out to our support team.
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CertiVault. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};
