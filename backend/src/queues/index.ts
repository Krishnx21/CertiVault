/**
 * Queues — barrel export
 * Import queues from here so Bull Board and workers share the same instances.
 */

export {
  emailQueue,
  getEmailQueue,
  EMAIL_QUEUE_NAME,
  queueWelcomeEmail,
  queueEmailVerification,
  queuePasswordReset,
  queueDocumentShared,
  queueDocumentVerified,
  queueExpiryReminder,
  queueDocumentShareLink,
} from "./email.queue.js";

export type {
  EmailJobData,
  WelcomeEmailJobData,
  EmailVerificationJobData,
  PasswordResetJobData,
  DocumentSharedJobData,
  DocumentVerifiedJobData,
  ExpiryReminderJobData,
  DocumentShareLinkJobData,
} from "./email.queue.js";

export {
  notificationQueue,
  getNotificationQueue,
  NOTIFICATION_QUEUE_NAME,
  queueUploadCompletedNotif,
  queueVerificationNotif,
  queueDocumentSharedNotif,
  queueStorageWarningNotif,
  queueExpiryReminderNotif,
} from "./notification.queue.js";

export type {
  NotificationJobData,
  UploadCompletedJobData,
  VerificationCompletedJobData,
  DocumentSharedNotifJobData,
  StorageWarningJobData,
  ExpiryReminderNotifJobData,
} from "./notification.queue.js";
