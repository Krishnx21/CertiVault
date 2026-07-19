/**
 * CertiVault — Prometheus Metrics Registry
 *
 * Single source of truth for all prom-client metric objects.
 * Import the named exports from here wherever you need to
 * increment / observe a metric in a service or middleware.
 *
 * All metrics are registered on a dedicated Registry (not the
 * default global one) so that unit tests can create isolated
 * registries without cross-test pollution.
 *
 * NOTE: prom-client v15 is a CommonJS package. In a Node.js ESM
 * project ("type": "module") we must use a default import and
 * destructure from it — named imports do NOT work with CJS modules
 * in ESM context.
 */

import promClient from "prom-client";
import type { Registry as RegistryType, Counter as CounterType, Gauge as GaugeType, Histogram as HistogramType } from "prom-client";

const { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } = promClient;

// Re-export types for consumers that import metric instances
export type { RegistryType, CounterType, GaugeType, HistogramType };

// ─── Shared registry ──────────────────────────────────────────────────────────
export const metricsRegistry = new Registry();

// Collect Node.js default metrics (event-loop lag, heap, GC, …) into our registry
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: "certivault_nodejs_",
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP METRICS  (populated by metrics.middleware.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** Total HTTP requests — labelled by method, normalised route, status code */
export const httpRequestsTotal = new Counter({
  name: "certivault_http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

/** Request duration histogram — labelled by method and normalised route */
export const httpRequestDurationMs = new Histogram({
  name: "certivault_http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route"] as const,
  // Buckets tuned for a typical API: 10 ms → 10 s
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000],
  registers: [metricsRegistry],
});

/** Gauge of currently in-flight HTTP requests */
export const httpActiveRequests = new Gauge({
  name: "certivault_http_active_requests",
  help: "Number of HTTP requests currently being processed",
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT METRICS  (incremented in document.service.ts)
// ─────────────────────────────────────────────────────────────────────────────

export const documentsUploadedTotal = new Counter({
  name: "certivault_documents_uploaded_total",
  help: "Total number of documents uploaded",
  labelNames: ["file_type", "storage_provider"] as const,
  registers: [metricsRegistry],
});

export const documentsDeletedTotal = new Counter({
  name: "certivault_documents_deleted_total",
  help: "Total number of documents deleted",
  registers: [metricsRegistry],
});

export const documentsDownloadedTotal = new Counter({
  name: "certivault_documents_downloaded_total",
  help: "Total number of document downloads",
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION METRICS
// ─────────────────────────────────────────────────────────────────────────────

export const verificationsTotal = new Counter({
  name: "certivault_verifications_total",
  help: "Total verification attempts",
  labelNames: ["status", "method"] as const,
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// VAULT / MEMBER METRICS
// ─────────────────────────────────────────────────────────────────────────────

export const vaultInvitesSentTotal = new Counter({
  name: "certivault_vault_invites_sent_total",
  help: "Total vault member invites sent",
  registers: [metricsRegistry],
});

export const vaultInvitesAcceptedTotal = new Counter({
  name: "certivault_vault_invites_accepted_total",
  help: "Total vault member invites accepted",
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// USER / AUTH METRICS
// ─────────────────────────────────────────────────────────────────────────────

export const usersRegisteredTotal = new Counter({
  name: "certivault_users_registered_total",
  help: "Total number of users registered",
  labelNames: ["method"] as const, // "email" | "google"
  registers: [metricsRegistry],
});

/** Updated periodically by a background job — not per-request */
export const activeUsersTotal = new Gauge({
  name: "certivault_active_users_total",
  help: "Number of users with a session in the last 24 hours",
  registers: [metricsRegistry],
});

export const authFailuresTotal = new Counter({
  name: "certivault_auth_failures_total",
  help: "Total authentication failures",
  labelNames: ["reason"] as const, // "invalid_password" | "locked" | "expired_token"
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE METRICS  (incremented in BullMQ workers)
// ─────────────────────────────────────────────────────────────────────────────

export const queueJobsTotal = new Counter({
  name: "certivault_queue_jobs_total",
  help: "Total BullMQ jobs processed",
  labelNames: ["queue", "status"] as const, // status: "completed" | "failed"
  registers: [metricsRegistry],
});

export const queueDepth = new Gauge({
  name: "certivault_queue_depth",
  help: "Number of waiting jobs in each queue",
  labelNames: ["queue"] as const,
  registers: [metricsRegistry],
});

export const queueJobDurationMs = new Histogram({
  name: "certivault_queue_job_duration_ms",
  help: "BullMQ job processing time in milliseconds",
  labelNames: ["queue", "job_type"] as const,
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000],
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE METRICS  (refreshed on a schedule — see metrics.refresh.ts)
// ─────────────────────────────────────────────────────────────────────────────

export const storageBytesTotal = new Gauge({
  name: "certivault_storage_bytes_total",
  help: "Total bytes stored across S3 and local filesystem",
  registers: [metricsRegistry],
});

export const storageFilesTotal = new Gauge({
  name: "certivault_storage_files_total",
  help: "Total number of files stored",
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR METRICS
// ─────────────────────────────────────────────────────────────────────────────

export const errorsTotal = new Counter({
  name: "certivault_errors_total",
  help: "Total application errors",
  labelNames: ["type", "route"] as const,
  registers: [metricsRegistry],
});
