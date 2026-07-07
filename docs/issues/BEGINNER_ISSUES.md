# Beginner-Friendly Backend Issues

These tasks are intentionally small and avoid authentication, authorization,
document storage, and other security-critical behavior. Contributors should
comment on an issue and wait for assignment before opening a pull request.

Use the labels `good first issue`, `backend`, and `ECSoC 2026` when publishing
these drafts as GitHub issues.

## 1. Add API version information to the health response

**Summary:** Include the package version in both health endpoint responses.

**Implementation notes:** Read the version once at startup; do not read the
package file for every request.

**Suggested files:** `backend/src/modules/health/health.controller.js`

**Acceptance criteria:**

- `/health/live` and `/health/ready` return a `version` string.
- Existing response fields remain unchanged.
- Tests cover the new field.

## 2. Add uptime to the liveness endpoint

**Summary:** Report process uptime in the liveness response.

**Implementation notes:** Use `process.uptime()` and expose whole seconds.

**Suggested files:** health controller and integration test.

**Acceptance criteria:**

- The response contains a non-negative numeric `uptimeSeconds` field.
- A test verifies its type and range without relying on an exact value.

## 3. Validate the API port more strictly

**Summary:** Improve environment validation so invalid TCP ports are rejected.

**Implementation notes:** A valid port is an integer from 1 through 65535.

**Suggested files:** `backend/src/config/env.js` and a new unit test.

**Acceptance criteria:**

- Missing `API_PORT` still defaults to `5000`.
- Non-numeric, fractional, zero, and out-of-range ports produce clear errors.
- Boundary values are tested.

## 4. Add a response-time header

**Summary:** Add middleware that returns `X-Response-Time` in milliseconds.

**Implementation notes:** Keep the middleware independent and register it near
the request-ID middleware.

**Suggested files:** `backend/src/middleware/responseTime.js` and `app.js`.

**Acceptance criteria:**

- Every response contains a non-negative millisecond duration.
- Health and 404 response tests verify the header exists.

## 5. Add a root API information endpoint

**Summary:** Add `GET /api` with the service name, status, and documentation hint.

**Implementation notes:** Do not expose environment variables or dependency data.

**Suggested files:** a small `info` module registered in `app.js`.

**Acceptance criteria:**

- `GET /api` returns HTTP 200 and a stable JSON shape.
- The response points users to `/health/live` without hard-coding a host.
- Integration tests cover the endpoint.

## 6. Add request-ID validation tests

**Summary:** Expand tests for generated and client-provided request IDs.

**Implementation notes:** The service currently echoes `X-Request-Id` or creates
a UUID when the header is absent.

**Suggested files:** `backend/tests/integration/app.test.js`.

**Acceptance criteria:**

- One test verifies a provided ID is preserved.
- One test verifies a generated ID is a valid UUID.
- Tests cover both response headers and JSON errors.

## 7. Add JSON parsing error coverage

**Summary:** Confirm malformed JSON receives the normalized error response.

**Implementation notes:** Send an invalid JSON body with the JSON content type.

**Suggested files:** integration tests and, only if needed, `errorHandler.js`.

**Acceptance criteria:**

- Malformed JSON returns HTTP 400.
- The response uses the standard `error.code`, `error.message`, and `requestId` fields.
- No stack trace is returned.

## 8. Add graceful-shutdown unit tests

**Summary:** Extract graceful shutdown into a testable helper and cover it.

**Implementation notes:** Preserve the existing `SIGINT` and `SIGTERM` behavior.

**Suggested files:** `backend/src/server.js` and `backend/tests/unit/`.

**Acceptance criteria:**

- The server stops accepting connections when shutdown begins.
- Repeated signals do not register duplicate shutdown work.
- Tests do not leave a listening server behind.

## 9. Add a backend code-format check

**Summary:** Configure Prettier checking for backend JavaScript and JSON files.

**Implementation notes:** Add a check script; do not reformat unrelated root docs.

**Suggested files:** backend package scripts and Prettier configuration.

**Acceptance criteria:**

- `npm run format:check` succeeds on the backend scaffold.
- The command checks source and test files.
- Contributor documentation mentions the command.

## 10. Document backend troubleshooting

**Summary:** Add a short guide for installation, startup, health checks, and
common port/environment errors.

**Suggested files:** `docs/operations/backend-development.md`.

**Acceptance criteria:**

- The guide contains commands for install, development, tests, and health checks.
- It explains `.env.example` and warns against committing secrets.
- It covers missing dependencies and port-conflict troubleshooting.
