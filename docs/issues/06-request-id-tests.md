# [Backend] Expand request-ID validation tests

**Labels:** `good first issue`, `backend`, `tests`, `ECSoC 2026`

## Description

Expand integration coverage for the request-ID middleware. The API should echo
a client-provided `X-Request-Id` or generate a UUID when the header is missing.

## Suggested files

- `backend/tests/integration/app.test.js`

## Acceptance criteria

- [ ] A provided request ID is preserved in the response header.
- [ ] A missing request ID produces a valid UUID.
- [ ] Normalized error bodies contain the same request ID as the header.
- [ ] Tests are deterministic and do not depend on request order.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
