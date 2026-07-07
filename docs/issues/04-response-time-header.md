# [Backend] Add an X-Response-Time header

**Labels:** `good first issue`, `backend`, `middleware`, `ECSoC 2026`

## Description

Create small Express middleware that adds an `X-Response-Time` header to every
response. Report a non-negative duration in milliseconds.

## Suggested files

- `backend/src/middleware/responseTime.js`
- `backend/src/app.js`
- `backend/tests/integration/app.test.js`

## Acceptance criteria

- [ ] Health, API, and 404 responses contain `X-Response-Time`.
- [ ] The value uses a documented millisecond format.
- [ ] The middleware is registered near the request-ID middleware.
- [ ] Integration tests verify the header.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
