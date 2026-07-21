/**
 * Email Worker
 * Processes all email jobs from the email queue.
 * Handles 6 job types, logs progress, and never crashes the worker on a single job failure.
 */

import { Worker, Job } from "bullmq";
import nodemailer from "nodemailer";
import { createBullMQConnection } from "../config/redis.js";
import { EMAIL_QUEUE_NAME } from "../queues/email.queue.js";
import type { EmailJobData } from "../queues/email.queue.js";
import { getEnv } from "../config/env.js";
import { createModuleLogger } from "../common/utils/logger.js";

const log = createModuleLogger("email-worker");

// ─── SMTP transporter (lazy — only used when SMTP credentials present) ─────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const env = getEnv();
  
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  
  return _transporter;
}

// ─── Shared email template wrapper ───────────────────────────────────────────

function htmlWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9fafb; border-radius: 8px; padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: 700; color: #1e40af; }
    .content { background: #fff; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .btn { display: inline-block; background: #1e40af; color: #fff; padding: 12px 24px;
           text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .link { word-break: break-all; color: #1e40af; }
    .note { margin-top: 16px; font-size: 14px; color: #6b7280; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 14px; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CertiVault</div>
    <div class="content">${body}</div>
    <div class="footer">&copy; ${new Date().getFullYear()} CertiVault. All rights reserved.</div>
  </div>
</body>
</html>`;
}

// ─── Per-job-type senders ─────────────────────────────────────────────────────

async function sendWelcomeEmail(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as { type: "welcome-email"; email: string; name: string };
  const env = getEnv();

  await job.updateProgress(50);

  const body = `
    <h2>Welcome to CertiVault!</h2>
    <p>Hi ${data.name},</p>
    <p>Your account is ready. Start managing and verifying your documents securely.</p>
    <ul>
      <li>Upload &amp; manage documents</li>
      <li>Verify authenticity with QR codes</li>
      <li>Invite team members to your vault</li>
      <li>Track document activity</li>
    </ul>
    <p><a href="${env.FRONTEND_ORIGIN}/dashboard" class="btn">Go to Dashboard</a></p>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject: "Welcome to CertiVault",
    html: htmlWrapper("Welcome to CertiVault", body),
  });
}

async function sendEmailVerification(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as {
    type: "email-verification";
    email: string;
    name: string;
    verificationToken: string;
  };
  const env = getEnv();
  const url = `${env.FRONTEND_ORIGIN}/verify-email?token=${data.verificationToken}`;

  await job.updateProgress(50);

  const body = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${data.name},</p>
    <p>Click the button below to verify your email address:</p>
    <p><a href="${url}" class="btn">Verify Email</a></p>
    <p>Or paste this link in your browser:</p>
    <p class="link">${url}</p>
    <p class="note">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject: "Verify Your Email — CertiVault",
    html: htmlWrapper("Verify Your Email", body),
  });
}

async function sendPasswordReset(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as {
    type: "password-reset";
    email: string;
    name: string;
    resetToken: string;
  };
  const env = getEnv();
  const url = `${env.FRONTEND_ORIGIN}/reset-password?token=${data.resetToken}`;

  await job.updateProgress(50);

  const body = `
    <h2>Reset Your Password</h2>
    <p>Hi ${data.name},</p>
    <p>We received a request to reset your CertiVault password.</p>
    <p><a href="${url}" class="btn">Reset Password</a></p>
    <p>Or paste this link in your browser:</p>
    <p class="link">${url}</p>
    <div class="warning">
      <strong>Security notice:</strong> This link expires in 1 hour.
      If you did not request a password reset, ignore this email — your password is unchanged.
    </div>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject: "Reset Your Password — CertiVault",
    html: htmlWrapper("Reset Your Password", body),
  });
}

async function sendDocumentShared(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as {
    type: "document-shared";
    email: string;
    recipientName: string;
    ownerName: string;
    role: "viewer" | "editor";
    inviteUrl: string;
  };
  const env = getEnv();
  const roleLabel = data.role === "editor" ? "Editor" : "Viewer";

  await job.updateProgress(50);

  log.info("Sending document-shared email", {
    to: data.email,
    recipientName: data.recipientName,
    ownerName: data.ownerName,
    role: data.role,
    inviteUrl: data.inviteUrl,
    emailFrom: env.EMAIL_FROM,
  });

  const body = `
    <h2>You've been invited to a Vault</h2>
    <p>Hi ${data.recipientName},</p>
    <p><strong>${data.ownerName}</strong> has invited you to access their CertiVault as a <strong>${roleLabel}</strong>.</p>
    <p>As a ${roleLabel} you can ${data.role === "editor" ? "view and upload documents" : "view documents"}.</p>
    <p><a href="${data.inviteUrl}" class="btn">Accept Invitation</a></p>
    <p>Or paste this link in your browser:</p>
    <p class="link">${data.inviteUrl}</p>
    <p class="note">This invitation expires in 24 hours. If you don't have a CertiVault account yet, you'll be prompted to create one.</p>
    <p class="note">If you did not expect this invitation, you can safely ignore this email.</p>
    <p class="note">App URL: <a href="${env.FRONTEND_ORIGIN}">${env.FRONTEND_ORIGIN}</a></p>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject: `${data.ownerName} invited you to their CertiVault`,
    html: htmlWrapper("Vault Invitation", body),
  });

  log.info("Document-shared email sent successfully", {
    to: data.email,
  });
}

async function sendDocumentVerified(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as {
    type: "document-verified";
    email: string;
    name: string;
    documentTitle: string;
    status: "verified" | "rejected";
    documentId: string;
    dashboardUrl: string;
  };
  const env = getEnv();

  await job.updateProgress(50);

  const isVerified = data.status === "verified";
  const subject = isVerified
    ? `Document Verified — ${data.documentTitle}`
    : `Document Verification Rejected — ${data.documentTitle}`;

  const body = `
    <h2>${isVerified ? "Document Verified ✓" : "Document Verification Rejected"}</h2>
    <p>Hi ${data.name},</p>
    ${
      isVerified
        ? `<p>Your document <strong>"${data.documentTitle}"</strong> has been <strong>successfully verified</strong>.</p>`
        : `<p>Unfortunately, your document <strong>"${data.documentTitle}"</strong> could not be verified at this time.</p>`
    }
    <p><a href="${data.dashboardUrl}" class="btn">View Document</a></p>
    ${
      !isVerified
        ? `<p class="note">Please review your document and try re-submitting for verification, or contact support if you believe this is an error.</p>`
        : ""
    }
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject,
    html: htmlWrapper(subject, body),
  });
}

async function sendExpiryReminder(
  transporter: nodemailer.Transporter,
  job: Job<EmailJobData>
): Promise<void> {
  const data = job.data as {
    type: "expiry-reminder";
    email: string;
    name: string;
    documentTitle: string;
    expiresAt: string;
    documentId: string;
    dashboardUrl: string;
  };
  const env = getEnv();
  const expiryDate = new Date(data.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await job.updateProgress(50);

  const body = `
    <h2>Document Expiry Reminder</h2>
    <p>Hi ${data.name},</p>
    <p>Your document <strong>"${data.documentTitle}"</strong> is set to expire on <strong>${expiryDate}</strong>.</p>
    <div class="warning">
      <strong>Action required:</strong> Please review and renew this document before it expires to avoid any disruption.
    </div>
    <p><a href="${data.dashboardUrl}" class="btn">View Document</a></p>
    <p class="note">You received this reminder because document expiry notifications are enabled for your account. Manage notification preferences in Settings.</p>
    <p class="note">App URL: <a href="${env.FRONTEND_ORIGIN}">${env.FRONTEND_ORIGIN}</a></p>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: data.email,
    subject: `Expiry Reminder: "${data.documentTitle}" expires on ${expiryDate}`,
    html: htmlWrapper("Document Expiry Reminder", body),
  });
}

// ─── Worker processor ─────────────────────────────────────────────────────────

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const env = getEnv();
  const start = Date.now();

  log.info(`Email job started`, {
    jobId: job.id,
    jobName: job.name,
    type: job.data.type,
    attempt: job.attemptsMade + 1,
  });

  await job.updateProgress(0);

  // If SMTP credentials are missing, log and skip gracefully (dev / CI)
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    log.warn("SMTP credentials not set — skipping email send (dev mode)", {
      jobId: job.id,
      type: job.data.type,
    });
    await job.updateProgress(100);
    return;
  }

  const transporter = getTransporter()!;

  switch (job.data.type) {
    case "welcome-email":
      await sendWelcomeEmail(transporter, job);
      break;
    case "email-verification":
      await sendEmailVerification(transporter, job);
      break;
    case "password-reset":
      await sendPasswordReset(transporter, job);
      break;
    case "document-shared":
      await sendDocumentShared(transporter, job);
      break;
    case "document-verified":
      await sendDocumentVerified(transporter, job);
      break;
    case "expiry-reminder":
      await sendExpiryReminder(transporter, job);
      break;
    default: {
      // Exhaustive check — TypeScript will error if a new type is added without a handler
      const _exhaustive: never = job.data;
      log.error("Unknown email job type", { jobData: _exhaustive });
      throw new Error(`Unknown email job type: ${(job.data as EmailJobData).type}`);
    }
  }

  await job.updateProgress(100);

  log.info(`Email job completed`, {
    jobId: job.id,
    type: job.data.type,
    durationMs: Date.now() - start,
  });
}

// ─── Worker instance ──────────────────────────────────────────────────────────

export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection: createBullMQConnection()!,
      // Automatically extend the job lock while processing
      lockDuration: 30_000,
    }
  );

  worker.on("completed", (job: Job<EmailJobData>) => {
    log.info("Email job completed", { jobId: job.id, type: job.data.type });
  });

  worker.on("failed", (job: Job<EmailJobData> | undefined, err: Error) => {
    log.error("Email job failed", {
      jobId: job?.id,
      type: job?.data?.type,
      attempt: job?.attemptsMade,
      error: err.message,
      stack: err.stack,
    });
  });

  worker.on("error", (err: Error) => {
    log.error("Email worker error", { error: err.message, stack: err.stack });
  });

  worker.on("stalled", (jobId: string) => {
    log.warn("Email job stalled", { jobId });
  });

  log.info("Email worker started");
  return worker;
}
