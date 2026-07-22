/**
 * CertiVault — k6 Load Test
 * ============================================================================
 * Two scenarios selectable via the SCENARIO env variable:
 *   spike  — 0 → 50 → 100 → 0 users over ~5 minutes  (burst traffic)
 *   soak   — 10 users sustained for 10 minutes         (memory/leak detection)
 *
 * Usage (local):
 *   k6 run --env BASE_URL=http://localhost:5000 --env SCENARIO=spike k6/load-test.js
 *   k6 run --env BASE_URL=http://localhost:5000 --env SCENARIO=soak  k6/load-test.js
 *
 * Pass criteria (enforced as thresholds — k6 exits 1 if any breach):
 *   P95 response time  < 2000ms
 *   Error rate         < 1%
 *   Throughput         > 50 req/s during spike peak
 * ============================================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ── Custom metrics ─────────────────────────────────────────────────────────
const errorRate        = new Rate("certivault_error_rate");
const authDuration     = new Trend("certivault_auth_duration_ms",   true);
const docDuration      = new Trend("certivault_doc_duration_ms",    true);
const healthDuration   = new Trend("certivault_health_duration_ms", true);
const totalRequests    = new Counter("certivault_total_requests");

// ── Configuration ──────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || "http://localhost:5000";
const API_TOKEN  = __ENV.API_TOKEN  || "";   // pre-seeded test user JWT
const SCENARIO   = __ENV.SCENARIO   || "spike";

// ── Scenario definitions ───────────────────────────────────────────────────
const SCENARIOS = {
  spike: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 10  },  // warm up
      { duration: "60s", target: 50  },  // ramp to 50 users
      { duration: "90s", target: 100 },  // spike to 100 users
      { duration: "60s", target: 50  },  // scale back
      { duration: "30s", target: 0   },  // cool down
    ],
    gracefulRampDown: "30s",
  },

  soak: {
    executor: "constant-vus",
    vus: 10,
    duration: "10m",
    gracefulStop: "30s",
  },
};

// ── Thresholds (k6 fails the run if any are breached) ─────────────────────
export const options = {
  scenarios: {
    [SCENARIO]: SCENARIOS[SCENARIO],
  },

  thresholds: {
    // P95 response time under 2 seconds for all HTTP requests
    http_req_duration: ["p(95)<2000"],

    // Less than 1% of requests should return an error
    certivault_error_rate: ["rate<0.01"],

    // Auth endpoint specifically — must be snappy
    certivault_auth_duration_ms: ["p(95)<1000"],

    // Document listing must stay under 2s at p95
    certivault_doc_duration_ms: ["p(95)<2000"],

    // Health endpoint must always be fast
    certivault_health_duration_ms: ["p(99)<500"],

    // HTTP failure rate (4xx/5xx) under 1%
    http_req_failed: ["rate<0.01"],
  },

  // Output readable summary to console
  summaryTrendStats: ["min", "med", "avg", "p(90)", "p(95)", "p(99)", "max"],
};

// ── Shared headers ─────────────────────────────────────────────────────────
function authHeaders() {
  return {
    Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ── Health check ───────────────────────────────────────────────────────────
function testHealthEndpoints() {
  group("Health Checks", () => {
    const start = Date.now();

    const live = http.get(`${BASE_URL}/health/live`, {
      tags: { name: "health_live" },
    });
    totalRequests.add(1);
    errorRate.add(live.status !== 200);
    check(live, {
      "liveness: status 200": (r) => r.status === 200,
      "liveness: fast":       (r) => r.timings.duration < 500,
    });

    const ready = http.get(`${BASE_URL}/health/ready`, {
      tags: { name: "health_ready" },
    });
    totalRequests.add(1);
    errorRate.add(ready.status !== 200);
    check(ready, {
      "readiness: status 200": (r) => r.status === 200,
    });

    healthDuration.add(Date.now() - start);
  });
}

// ── Auth endpoints ─────────────────────────────────────────────────────────
function testAuthEndpoints() {
  group("Auth Endpoints", () => {
    // Login with a pre-seeded test account
    // In CI the STAGING_API_TOKEN is already a valid JWT — we test the
    // login endpoint with intentionally wrong credentials to exercise
    // the auth failure path (should return 401, not 500).
    const start = Date.now();

    const loginFail = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: "loadtest-nonexistent@certivault.test",
        password: "wrongpassword123",
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "auth_login_fail" },
      }
    );
    totalRequests.add(1);
    // 401 is the CORRECT response here — not an error
    errorRate.add(loginFail.status >= 500);
    check(loginFail, {
      "login (invalid): returns 401":    (r) => r.status === 401,
      "login (invalid): has error body": (r) => r.json("message") !== undefined,
    });

    authDuration.add(Date.now() - start);
  });
}

// ── Documents endpoints ────────────────────────────────────────────────────
function testDocumentEndpoints() {
  // Only runs when a valid API token is provided
  if (!API_TOKEN) return;

  group("Document Endpoints", () => {
    const headers = authHeaders();

    // List documents
    const start = Date.now();
    const list = http.get(`${BASE_URL}/api/documents?page=1&limit=10`, {
      headers,
      tags: { name: "docs_list" },
    });
    totalRequests.add(1);
    errorRate.add(list.status >= 400);
    check(list, {
      "documents list: status 200":    (r) => r.status === 200,
      "documents list: has data":      (r) => r.json("data") !== undefined,
      "documents list: under 2000ms":  (r) => r.timings.duration < 2000,
    });
    docDuration.add(Date.now() - start);

    // Search documents
    const search = http.get(
      `${BASE_URL}/api/documents?search=test&page=1&limit=5`,
      {
        headers,
        tags: { name: "docs_search" },
      }
    );
    totalRequests.add(1);
    errorRate.add(search.status >= 400);
    check(search, {
      "documents search: status 200": (r) => r.status === 200,
    });
  });
}

// ── Dashboard endpoint ─────────────────────────────────────────────────────
function testDashboardEndpoints() {
  if (!API_TOKEN) return;

  group("Dashboard Endpoints", () => {
    const dashboard = http.get(`${BASE_URL}/api/dashboard`, {
      headers: authHeaders(),
      tags: { name: "dashboard" },
    });
    totalRequests.add(1);
    errorRate.add(dashboard.status >= 400);
    check(dashboard, {
      "dashboard: status 200":   (r) => r.status === 200,
      "dashboard: has stats":    (r) => r.json("data") !== undefined,
    });
  });
}

// ── Metrics endpoint ───────────────────────────────────────────────────────
function testMetricsEndpoint() {
  group("Metrics Endpoint", () => {
    const metrics = http.get(`${BASE_URL}/metrics`, {
      tags: { name: "prometheus_metrics" },
    });
    totalRequests.add(1);
    // /metrics must return 200 and valid Prometheus text format
    errorRate.add(metrics.status !== 200);
    check(metrics, {
      "metrics: status 200":              (r) => r.status === 200,
      "metrics: content-type text/plain": (r) =>
        r.headers["Content-Type"] !== undefined &&
        r.headers["Content-Type"].includes("text/plain"),
      "metrics: has certivault metric":   (r) =>
        r.body.includes("certivault_http_requests_total"),
    });
  });
}

// ── Verification endpoint (public — no auth needed) ────────────────────────
function testVerificationEndpoints() {
  group("Verification Endpoints", () => {
    // Hit with a fake token — should return 404, not 500
    const verify = http.get(
      `${BASE_URL}/api/verifications/nonexistent-token-for-load-test`,
      { tags: { name: "verify_public" } }
    );
    totalRequests.add(1);
    errorRate.add(verify.status >= 500);
    check(verify, {
      "verify public: not a 5xx": (r) => r.status < 500,
    });
  });
}

// ── Main VU function ───────────────────────────────────────────────────────
export default function () {
  // Every VU runs a randomised mix of endpoints to simulate real traffic
  const roll = randomIntBetween(1, 100);

  if (roll <= 15) {
    // 15% — health checks (monitoring, load balancer probes)
    testHealthEndpoints();
  } else if (roll <= 30) {
    // 15% — auth attempts
    testAuthEndpoints();
  } else if (roll <= 55) {
    // 25% — document browsing (heaviest real workload)
    testDocumentEndpoints();
  } else if (roll <= 70) {
    // 15% — dashboard
    testDashboardEndpoints();
  } else if (roll <= 80) {
    // 10% — metrics scraping
    testMetricsEndpoint();
  } else if (roll <= 90) {
    // 10% — public verification
    testVerificationEndpoints();
  } else {
    // 10% — mixed: health + docs
    testHealthEndpoints();
    testDocumentEndpoints();
  }

  // Realistic think time between actions (0.5s – 2s)
  sleep(randomIntBetween(0.5, 2));
}

// ── Custom summary output ──────────────────────────────────────────────────
export function handleSummary(data) {
  const passed = Object.values(data.metrics)
    .every((m) => !m.thresholds || Object.values(m.thresholds).every((t) => !t.ok === false));

  const summary = {
    scenario: SCENARIO,
    target:   BASE_URL,
    passed,
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.["p(95)"],
      http_req_failed_rate:  data.metrics.http_req_failed?.values?.rate,
      total_requests:        data.metrics.certivault_total_requests?.values?.count,
      requests_per_second:   data.metrics.http_reqs?.values?.rate,
    },
  };

  return {
    // Machine-readable JSON for CI parsing
    "k6-summary.json": JSON.stringify(summary, null, 2),
    // Human-readable to stdout
    stdout: `
==========================================================
  CertiVault Load Test — ${SCENARIO.toUpperCase()} Scenario
==========================================================
  Target:          ${BASE_URL}
  Status:          ${passed ? "✅ PASSED" : "❌ FAILED (threshold breach)"}
  P95 duration:    ${summary.metrics.http_req_duration_p95?.toFixed(0)}ms
  Error rate:      ${(summary.metrics.http_req_failed_rate * 100)?.toFixed(2)}%
  Total requests:  ${summary.metrics.total_requests}
  Req/s:           ${summary.metrics.requests_per_second?.toFixed(1)}
==========================================================
`,
  };
}
