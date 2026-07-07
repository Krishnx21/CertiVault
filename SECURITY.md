# Security Policy

## Supported Versions

CertiVault is currently in its initial development phase. Security fixes will be applied to the latest version on `main`.

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests, or discussions.** Public disclosure before a fix is available puts all users at risk.

### How to Report

Report vulnerabilities **privately** using one of the following methods:

1. **GitHub Private Security Advisory** *(preferred)*
   Open a [private security advisory](../../security/advisories/new) directly in this repository. GitHub keeps these confidential until you and the maintainers agree on a disclosure timeline.

2. **Email**
   If the advisory feature is unavailable, contact the maintainers directly. Check the repository's GitHub profile for contact information.

### What to Include

Please provide as much of the following as possible so we can triage and reproduce the issue quickly:

- A clear description of the vulnerability and its potential impact
- The affected component (authentication, file upload, share links, etc.)
- Steps to reproduce or a proof-of-concept (if safe to share)
- Any mitigating factors you have identified
- Your preferred disclosure timeline

### What to Expect

- **Acknowledgement within 48 hours** of receiving the report.
- **Initial assessment within 5 business days** — we will confirm whether the issue is valid and outline next steps.
- **Coordinated disclosure** — we will work with you to agree on a public disclosure date, typically after a fix is released. We aim to resolve critical issues within 30 days.
- **Credit** — contributors who responsibly report valid vulnerabilities will be acknowledged in the release notes (unless you prefer to remain anonymous).

---

## Scope

The following are **in scope** for security reports:

- Authentication and session management (JWT, refresh tokens, cookies)
- Authorization bypass and privilege escalation
- Document access control and ownership checks
- File upload safety (path traversal, MIME bypass, malicious content)
- Injection attacks (NoSQL injection, command injection)
- Data exposure (secrets in logs, unprotected API responses)
- Insecure direct object references

The following are **out of scope**:

- Denial of service through resource exhaustion (report as a standard issue instead)
- Issues in third-party dependencies that already have a published CVE and an available patch
- Theoretical vulnerabilities without a realistic attack path
- Issues requiring physical access to a user's device

---

## Preferred Languages

We prefer reports in English.

---

*Thank you for helping keep CertiVault and its users safe.*
