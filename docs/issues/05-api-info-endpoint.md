# [Backend] Add a root API information endpoint

**Labels:** `good first issue`, `backend`, `API`, `ECSoC 2026`

## Description

Add `GET /api` to help developers confirm they reached the CertiVault API. The
response should identify the service and point to the liveness endpoint without
exposing environment variables or dependency details.

## Suggested files

- `backend/src/modules/info/info.routes.js`
- `backend/src/app.js`
- `backend/tests/integration/app.test.js`

## Acceptance criteria

- [ ] `GET /api` returns HTTP 200.
- [ ] The JSON contains a service name, status, and `/health/live` path.
- [ ] No secrets, environment values, or stack details are exposed.
- [ ] Integration tests document the stable response shape.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
