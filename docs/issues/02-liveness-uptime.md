# [Backend] Add uptime to the liveness endpoint

**Labels:** `good first issue`, `backend`, `ECSoC 2026`

## Description

Report how long the API process has been running in the `GET /health/live`
response. Use `process.uptime()` and return whole seconds.

## Suggested files

- `backend/src/modules/health/health.controller.js`
- `backend/tests/integration/app.test.js`

## Acceptance criteria

- [ ] The response contains a numeric `uptimeSeconds` field.
- [ ] The value is a non-negative whole number.
- [ ] Tests validate the type and range without expecting an exact value.
- [ ] Existing health tests continue to pass.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
