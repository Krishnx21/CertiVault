# [Backend] Add an automated code-format check

**Labels:** `good first issue`, `backend`, `tooling`, `ECSoC 2026`

## Description

Configure Prettier for backend JavaScript and JSON files and expose a check-only
npm command. Do not reformat unrelated documentation or frontend files.

## Suggested files

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.prettierrc.json`
- `CONTRIBUTING.md`

## Acceptance criteria

- [ ] `npm run format:check` checks backend source and tests.
- [ ] The existing backend files pass the command.
- [ ] Contributor documentation mentions the new check.
- [ ] The pull request contains no unrelated formatting changes.

## Contribution note

Ask for assignment before starting and target the `ecsoc-2026` branch.
