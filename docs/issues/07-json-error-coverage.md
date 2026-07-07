# [Backend] Add malformed JSON error coverage

**Labels:** `good first issue`, `backend`, `tests`, `error-handling`, `ECSoC 2026`

## Description

Send malformed JSON to the API and ensure Express parsing failures use the same
safe, normalized error shape as other API errors.

## Suggested files

- `backend/tests/integration/app.test.js`
- `backend/src/middleware/errorHandler.js` if normalization needs adjustment

## Acceptance criteria

- [ ] Malformed JSON with the JSON content type returns HTTP 400.
- [ ] The response contains `error.code`, `error.message`, and `requestId`.
- [ ] The response does not expose a stack trace or parser internals.
- [ ] Existing 404 and health tests still pass.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
