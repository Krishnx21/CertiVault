# Open Source Readiness Guide

CertiVault now includes a professional GitHub configuration layer for community
health, issue intake, pull request review, automation, dependency updates,
security scanning, and release drafting.

## Missing folders to consider

- `docs/architecture/` for diagrams and architecture decision records.
- `docs/decisions/` for ADRs.
- `infrastructure/` for Terraform and Kubernetes manifests.
- `monitoring/` for dashboards, alerts, and logging configuration.
- `workers/` for background OCR, reminder, and verification jobs.
- `tests/e2e/` for cross-service browser/API flows.

## Recommended badges

- CI status
- CodeQL status
- License
- OpenSSF Scorecard
- Good first issues
- Release version
- Codecov, after coverage reporting is configured

## Recommended repository topics

`document-management`, `document-verification`, `security`, `react`,
`express`, `nodejs`, `open-source`, `github-actions`, `certificates`,
`audit-trail`, `cloud-native`

## Social preview image

Use a simple 1280x640 image with:

- CertiVault logo or wordmark
- “Secure Document Management & Verification”
- A visual motif for vault, document, checksum, and trust
- High contrast text that remains readable in dark and light contexts

## Optional tooling prerequisites

- Docker workflows become active when Dockerfiles are added.
- Codecov upload becomes useful when `coverage/lcov.info` is generated.
- Type-check gates run automatically after a `typecheck` npm script is added.
- Lint gates run automatically after a `lint` npm script is added.
