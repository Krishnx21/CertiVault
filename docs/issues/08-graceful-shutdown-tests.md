# [Backend] Add graceful-shutdown tests

**Labels:** `good first issue`, `backend`, `tests`, `ECSoC 2026`

## Description

Extract the server shutdown behavior into a small testable helper and add unit
tests. Preserve the current handling for `SIGINT` and `SIGTERM`.

## Suggested files

- `backend/src/server.js`
- `backend/src/utils/gracefulShutdown.js`
- `backend/tests/unit/gracefulShutdown.test.js`

## Acceptance criteria

- [ ] Shutdown stops the server from accepting new connections.
- [ ] A close error sets a failing exit status.
- [ ] Repeated signals do not start duplicate shutdown work.
- [ ] Tests clean up all listeners and open servers.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
