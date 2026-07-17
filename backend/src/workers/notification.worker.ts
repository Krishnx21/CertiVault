/**
 * Notification Worker
 * Processes in-app notification jobs — creates Notification documents in MongoDB.
 * This worker must connect to MongoDB before processing begins.
 */

import { Worker, Job } from "bullmq";
import { redis } from "../config/redis.js";
import { NOTIFICATION_QUEUE_NAME } from "../queues/notification.queue.js";
import type { NotificationJobData } from "../queues/notification.queue.js";
import { createModuleLogger } from "../common/utils/logger.js";
import { createNotification } from "../modules/notifications/notification.service.js";

const log = createModuleLogger("notification-worker");

// ─── Per-job-type handlers ────────────────────────────────────────────────────

async function handleUploadCompleted(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data as {
    type: "upload-completed";
    userId: string;
    documentTitle: string;
    documentId: string;
  };

  await job.updateProgress(50);

  await createNotification({
    userId: data.userId,
    type: "upload_completed",
    title: "Upload Completed",
    message: `Your document "${data.documentTitle}" has been successfully uploaded.`,
    data: {
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      actionUrl: `/documents`,
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
}

async function handleVerificationCompleted(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data as {
    type: "verification-completed";
    userId: string;
    documentTitle: string;
    documentId: string;
    status: "verified" | "rejected";
  };

  await job.updateProgress(50);

  const isVerified = data.status === "verified";

  await createNotification({
    userId: data.userId,
    type: isVerified ? "verification_completed" : "verification_rejected",
    title: isVerified ? "Verification Completed" : "Verification Rejected",
    message: isVerified
      ? `Your document "${data.documentTitle}" has been verified successfully.`
      : `Your document "${data.documentTitle}" verification was rejected.`,
    data: {
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      actionUrl: `/verification/${data.documentId}`,
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}

async function handleDocumentSharedNotif(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data as {
    type: "document-shared-notif";
    recipientUserId: string;
    ownerName: string;
    role: "viewer" | "editor";
  };

  await job.updateProgress(50);

  await createNotification({
    userId: data.recipientUserId,
    type: "document_shared",
    title: "Vault Invitation Received",
    message: `${data.ownerName} has invited you to access their vault as a ${data.role}.`,
    data: {
      memberName: data.ownerName,
      actionUrl: `/vault/shared`,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
}

async function handleStorageWarning(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data as {
    type: "storage-warning";
    userId: string;
    storageUsed: number;
    storageLimit: number;
  };

  await job.updateProgress(50);

  const pct = Math.round((data.storageUsed / data.storageLimit) * 100);
  const usedGB = (data.storageUsed / 1024 / 1024 / 1024).toFixed(2);
  const limitGB = (data.storageLimit / 1024 / 1024 / 1024).toFixed(2);

  await createNotification({
    userId: data.userId,
    type: "storage_warning",
    title: "Storage Warning",
    message: `You have used ${pct}% of your storage (${usedGB} GB / ${limitGB} GB).`,
    data: {
      storageUsed: data.storageUsed,
      storageLimit: data.storageLimit,
      actionUrl: `/settings`,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

async function handleExpiryReminderNotif(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data as {
    type: "expiry-reminder-notif";
    userId: string;
    documentTitle: string;
    documentId: string;
    expiresAt: string;
  };

  await job.updateProgress(50);

  const expiryDate = new Date(data.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await createNotification({
    userId: data.userId,
    type: "document_verified", // closest existing type — Phase 2 adds vault-specific types
    title: "Document Expiring Soon",
    message: `Your document "${data.documentTitle}" expires on ${expiryDate}.`,
    data: {
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      actionUrl: `/documents`,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

// ─── Worker processor ─────────────────────────────────────────────────────────

async function processNotificationJob(
  job: Job<NotificationJobData>
): Promise<void> {
  const start = Date.now();

  log.info("Notification job started", {
    jobId: job.id,
    jobName: job.name,
    type: job.data.type,
    attempt: job.attemptsMade + 1,
  });

  await job.updateProgress(0);

  switch (job.data.type) {
    case "upload-completed":
      await handleUploadCompleted(job);
      break;
    case "verification-completed":
      await handleVerificationCompleted(job);
      break;
    case "document-shared-notif":
      await handleDocumentSharedNotif(job);
      break;
    case "storage-warning":
      await handleStorageWarning(job);
      break;
    case "expiry-reminder-notif":
      await handleExpiryReminderNotif(job);
      break;
    default: {
      const _exhaustive: never = job.data;
      log.error("Unknown notification job type", { jobData: _exhaustive });
      throw new Error(
        `Unknown notification job type: ${(job.data as NotificationJobData).type}`
      );
    }
  }

  await job.updateProgress(100);

  log.info("Notification job completed", {
    jobId: job.id,
    type: job.data.type,
    durationMs: Date.now() - start,
  });
}

// ─── Worker instance ──────────────────────────────────────────────────────────

export function startNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    NOTIFICATION_QUEUE_NAME,
    processNotificationJob,
    {
      connection: redis,
      concurrency: 10,
      lockDuration: 15_000,
    }
  );

  worker.on("completed", (job: Job<NotificationJobData>) => {
    log.info("Notification job completed", {
      jobId: job.id,
      type: job.data.type,
    });
  });

  worker.on("failed", (job: Job<NotificationJobData> | undefined, err: Error) => {
    log.error("Notification job failed", {
      jobId: job?.id,
      type: job?.data?.type,
      attempt: job?.attemptsMade,
      error: err.message,
    });
  });

  worker.on("error", (err: Error) => {
    log.error("Notification worker error", {
      error: err.message,
      stack: err.stack,
    });
  });

  worker.on("stalled", (jobId: string) => {
    log.warn("Notification job stalled", { jobId });
  });

  log.info("Notification worker started");
  return worker;
}
