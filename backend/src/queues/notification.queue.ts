/**
 * Notification Job Queue
 * Defines the BullMQ queue and all typed job payloads for in-app notifications.
 *
 * The Queue instance is created lazily on first use so that importing this
 * module never crashes when Redis is temporarily unavailable at startup.
 */

import { Queue } from "bullmq";
import { createBullMQConnection } from "../config/redis.js";
import { createModuleLogger } from "../common/utils/logger.js";

const log = createModuleLogger("notification-queue");

// ─── Job payload types ────────────────────────────────────────────────────────

export interface UploadCompletedJobData {
  type: "upload-completed";
  userId: string;
  documentTitle: string;
  documentId: string;
}

export interface VerificationCompletedJobData {
  type: "verification-completed";
  userId: string;
  documentTitle: string;
  documentId: string;
  /** "verified" | "rejected" */
  status: "verified" | "rejected";
}

export interface DocumentSharedNotifJobData {
  type: "document-shared-notif";
  /** The recipient user ID (vault member being invited) */
  recipientUserId: string;
  ownerName: string;
  role: "viewer" | "editor";
}

export interface StorageWarningJobData {
  type: "storage-warning";
  userId: string;
  storageUsed: number;
  storageLimit: number;
}

export interface ExpiryReminderNotifJobData {
  type: "expiry-reminder-notif";
  userId: string;
  documentTitle: string;
  documentId: string;
  expiresAt: string; // ISO date string
}

export type NotificationJobData =
  | UploadCompletedJobData
  | VerificationCompletedJobData
  | DocumentSharedNotifJobData
  | StorageWarningJobData
  | ExpiryReminderNotifJobData;

// ─── Queue instance (lazy singleton) ─────────────────────────────────────────
// Returns null when Redis is not configured so callers can skip gracefully.

export const NOTIFICATION_QUEUE_NAME = "notification";

let _notificationQueue: Queue<NotificationJobData> | null = null;

export function getNotificationQueue(): Queue<NotificationJobData> | null {
  if (_notificationQueue) return _notificationQueue;

  const connection = createBullMQConnection();
  if (!connection) {
    log.warn("Notification queue: Redis not configured — queue is disabled");
    return null;
  }

  _notificationQueue = new Queue<NotificationJobData>(
    NOTIFICATION_QUEUE_NAME,
    {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    }
  );

  _notificationQueue.on("error", (err: Error) => {
    log.error("Notification queue error", { error: err.message });
  });

  log.info("Notification queue initialised");
  return _notificationQueue;
}

/**
 * @deprecated Use getNotificationQueue() instead. Kept for backwards-compatibility
 * with Bull Board and any direct queue references. Returns an empty proxy when
 * Redis is not configured.
 */
export const notificationQueue = new Proxy({} as Queue<NotificationJobData>, {
  get(_target, prop) {
    const q = getNotificationQueue();
    if (!q) return undefined;
    return (q as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ─── Typed job adder helpers ──────────────────────────────────────────────────
// All helpers silently skip when Redis is not configured (queue is null).

export async function queueUploadCompletedNotif(
  data: Omit<UploadCompletedJobData, "type">
): Promise<void> {
  const q = getNotificationQueue();
  if (!q) { log.warn("queueUploadCompletedNotif: skipped (queue disabled)"); return; }
  await q.add("upload-completed", { type: "upload-completed", ...data });
  log.info("Queued upload-completed notif", { userId: data.userId });
}

export async function queueVerificationNotif(
  data: Omit<VerificationCompletedJobData, "type">
): Promise<void> {
  const q = getNotificationQueue();
  if (!q) { log.warn("queueVerificationNotif: skipped (queue disabled)"); return; }
  await q.add("verification-completed", { type: "verification-completed", ...data });
  log.info("Queued verification-completed notif", { userId: data.userId });
}

export async function queueDocumentSharedNotif(
  data: Omit<DocumentSharedNotifJobData, "type">
): Promise<void> {
  const q = getNotificationQueue();
  if (!q) { log.warn("queueDocumentSharedNotif: skipped (queue disabled)"); return; }
  await q.add("document-shared-notif", { type: "document-shared-notif", ...data });
  log.info("Queued document-shared-notif", { recipientUserId: data.recipientUserId });
}

export async function queueStorageWarningNotif(
  data: Omit<StorageWarningJobData, "type">
): Promise<void> {
  const q = getNotificationQueue();
  if (!q) { log.warn("queueStorageWarningNotif: skipped (queue disabled)"); return; }
  await q.add("storage-warning", { type: "storage-warning", ...data });
  log.info("Queued storage-warning notif", { userId: data.userId });
}

export async function queueExpiryReminderNotif(
  data: Omit<ExpiryReminderNotifJobData, "type">
): Promise<void> {
  const q = getNotificationQueue();
  if (!q) { log.warn("queueExpiryReminderNotif: skipped (queue disabled)"); return; }
  await q.add("expiry-reminder-notif", { type: "expiry-reminder-notif", ...data });
  log.info("Queued expiry-reminder-notif", { userId: data.userId });
}
