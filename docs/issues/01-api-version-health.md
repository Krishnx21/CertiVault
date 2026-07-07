# [Backend] Add API version to health responses

**Labels:** `good first issue`, `backend`, `ECSoC 2026`

## Description

Include the backend package version in the responses from `GET /health/live`
and `GET /health/ready`. Read the version once when the application starts; do
not read `package.json` for every request.

## Suggested files

- `backend/src/modules/health/health.controller.js`
- `backend/tests/integration/app.test.js`

## Acceptance criteria

- [ ] Both health responses contain a non-empty `version` string.
- [ ] Existing response fields remain unchanged.
- [ ] Integration tests cover the version field.
- [ ] `npm test` passes in `backend/`.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
