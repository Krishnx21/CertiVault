/**
 * CertiVault — Prometheus HTTP Metrics Middleware
 *
 * Intercepts every request/response cycle and records:
 *   - certivault_http_requests_total        (counter)
 *   - certivault_http_request_duration_ms   (histogram)
 *   - certivault_http_active_requests       (gauge)
 *
 * Route normalisation prevents high-cardinality labels:
 *   /api/documents/507f1f77bcf86cd799439011  →  /api/documents/:id
 *   /api/vault/members/abc123token           →  /api/vault/members/:id
 *
 * /metrics and /health/* are excluded from collection to avoid
 * recursion and irrelevant noise in the data.
 */

import { Request, Response, NextFunction } from "express";
import {
  httpRequestsTotal,
  httpRequestDurationMs,
  httpActiveRequests,
} from "../config/metrics.js";

// ─── Route normalisation ──────────────────────────────────────────────────────

/**
 * Pattern list applied in order.
 * Each entry maps a regex → replacement string.
 * Add new patterns here as new route segments are introduced.
 */
const NORMALISATION_PATTERNS: Array<[RegExp, string]> = [
  // MongoDB ObjectIds (24-char hex)
  [/\/[0-9a-f]{24}(?=\/|$)/gi, "/:id"],
  // UUIDs (8-4-4-4-12)
  [/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:id"],
  // Invite / verification tokens (32-64 hex chars that look like random tokens)
  [/\/[0-9a-f]{32,64}(?=\/|$)/gi, "/:token"],
  // Pure numeric IDs
  [/\/\d{4,}(?=\/|$)/g, "/:id"],
];

/**
 * Convert a raw request path into a low-cardinality label.
 *
 * Express 5 populates req.route.path once the route is matched,
 * which gives us the template (e.g. "/api/documents/:id") for free.
 * We fall back to regex-based normalisation for unmatched paths.
 */
function normaliseRoute(req: Request): string {
  // Express 5: use matched route template when available
  if (req.route?.path) {
    const base = req.baseUrl ?? "";
    const routePath: string =
      typeof req.route.path === "string"
        ? req.route.path
        : req.route.path.toString();
    return base + routePath;
  }

  // Fallback: apply regex patterns to the raw URL (strip query string first)
  let path = req.path ?? req.url ?? "/";
  // Remove query string
  const qIdx = path.indexOf("?");
  if (qIdx !== -1) path = path.slice(0, qIdx);

  for (const [pattern, replacement] of NORMALISATION_PATTERNS) {
    path = path.replace(pattern, replacement);
  }

  return path;
}

// ─── Paths excluded from metrics collection ───────────────────────────────────
const EXCLUDED_PREFIXES = ["/metrics", "/health"];

function isExcluded(path: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip excluded paths immediately
  if (isExcluded(req.path)) {
    next();
    return;
  }

  const startTime = performance.now();
  httpActiveRequests.inc();

  // Hook into res.end — called for every response including streams
  const originalEnd = res.end.bind(res) as typeof res.end;

  // We need to wrap res.end to capture the final status code.
  // Using type assertion because overloads make the signature complex.
  (res as unknown as { end: (...args: unknown[]) => Response }).end = function (
    ...args: unknown[]
  ): Response {
    httpActiveRequests.dec();

    const durationMs = performance.now() - startTime;
    const route = normaliseRoute(req);
    const method = req.method.toUpperCase();
    const statusCode = String(res.statusCode);

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDurationMs.observe({ method, route }, durationMs);

    return (originalEnd as (...args: unknown[]) => Response)(...args);
  };

  next();
}
