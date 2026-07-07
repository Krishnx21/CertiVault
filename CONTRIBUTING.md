# Contributing to CertiVault

Thank you for considering a contribution to CertiVault! Every bug report, feature idea, documentation improvement, and line of code helps move the platform forward.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Standard Workflow](#standard-workflow)
- [Branch Naming](#branch-naming)
- [Commit Style](#commit-style)
- [Pull Request Checklist](#pull-request-checklist)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Reporting Security Issues](#reporting-security-issues)

---

## Code of Conduct

All participants are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Before You Start

- Search [open issues](../../issues) to avoid duplicating work.
- For significant changes, open an issue to discuss the approach before writing code.
- Security vulnerabilities must be reported **privately** — see [SECURITY.md](SECURITY.md).

---

## Standard Workflow

1. **Find or raise an issue** — identify an open issue or open a new one describing the bug or feature.
2. **Request assignment** — comment on the issue: *"I'd like to work on this."* Wait for a maintainer to assign you before opening a PR.
3. **Fork the repository** and create a branch from `main`.
4. **Write code, tests, and documentation.**
5. **Open a pull request** against `main` and apply the **`ECSoC26`** label before or at the time of merge.

> **Daily limit:** A maximum of 5 PRs are scored per project per contributor per day.

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/document-upload` |
| Bug fix | `fix/<short-description>` | `fix/token-refresh-loop` |
| Documentation | `docs/<short-description>` | `docs/api-endpoints` |
| Chore / config | `chore/<short-description>` | `chore/eslint-config` |

---

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`

**Examples:**

```
feat(auth): add JWT refresh rotation
fix(documents): prevent orphaned S3 objects on DB failure
docs(contributing): add branch naming guide
```

Keep the summary line under 72 characters and write it in the imperative mood (*"add X"*, not *"added X"*).

---

## Pull Request Checklist

Before submitting, confirm:

- [ ] Branch is based on the latest `main`
- [ ] All existing tests pass (`npm test` in the relevant workspace)
- [ ] New behaviour is covered by tests
- [ ] Code passes linting (`npm run lint`)
- [ ] `.env.example` is updated if new environment variables are introduced
- [ ] The PR description links to the related issue (`Closes #<number>`)
- [ ] The **`ECSoC26`** label is applied

---

## Development Setup

```bash
# 1. Fork and clone your fork
git clone https://github.com/<your-username>/CertiVault.git
cd CertiVault

# 2. Start local services (requires Docker)
docker compose up -d

# 3. Configure the backend
cd backend
cp .env.example .env
# Edit .env with your local values

# 4. Install dependencies and run
npm install
npm run dev

# 5. Run tests
npm test
```

---

## Coding Standards

- **JavaScript** — follow the ESLint configuration in the workspace.
- **Naming** — `camelCase` for variables and functions; `PascalCase` for classes and React components.
- **Error handling** — use `ApiError` and `asyncHandler` rather than raw `try/catch` in controllers.
- **No secrets in code** — all credentials and configuration go through environment variables.
- **Audit events** — every security-sensitive action must emit an audit record.
- **Keep controllers thin** — business logic belongs in services, not controllers.

---

## Reporting Security Issues

Do **not** open a public issue for security vulnerabilities. Follow the process in [SECURITY.md](SECURITY.md).

---

*By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).*
