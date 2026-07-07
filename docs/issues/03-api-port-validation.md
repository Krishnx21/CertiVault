# [Backend] Validate the API port strictly

**Labels:** `good first issue`, `backend`, `validation`, `ECSoC 2026`

## Description

Improve environment validation so the server rejects invalid TCP port values
with a clear error. Valid ports are integers from 1 through 65535.

## Suggested files

- `backend/src/config/env.js`
- `backend/tests/unit/env.test.js`

## Acceptance criteria

- [ ] Missing `API_PORT` continues to default to `5000`.
- [ ] Non-numeric, fractional, zero, negative, and values above 65535 fail.
- [ ] Valid boundary values are accepted.
- [ ] Unit tests cover valid and invalid examples.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
