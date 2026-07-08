# Contributing to CertiVault

Thank you for helping build CertiVault. The project participates in **Elite Coders Summer of Code (ECSoC) 2026**, with [Krishna Kumar](https://github.com/Krishnx21) serving as Project Admin.

## Code of Conduct and Security

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Never disclose vulnerabilities publicly; follow [SECURITY.md](SECURITY.md) and use GitHub Private Vulnerability Reporting.

## Claim an Issue First

1. Search open issues and pull requests for existing work.
2. Choose an unassigned issue with a clear scope.
3. Comment that you would like to work on it and briefly describe your approach.
4. Wait for a maintainer to assign the issue before coding.
5. Ask for clarification on the issue rather than making product or security assumptions.
6. Submit one focused pull request per assigned issue.

Unassigned, duplicate, copied, spam, empty, or artificial pull requests may be closed.

## Fork and Clone

1. Click **Fork** on the CertiVault GitHub repository.
2. Clone your fork and add the project repository as `upstream`.

```bash
git clone https://github.com/YOUR-USERNAME/CertiVault.git
cd CertiVault
git remote add upstream https://github.com/Krishnx21/CertiVault.git
git fetch upstream
```

## Create a Branch

ECSoC work starts from and returns to `ecsoc-2026`. Do not target `main` directly.

```bash
git switch ecsoc-2026
git pull upstream ecsoc-2026
git switch -c type/short-description
```

Use lowercase, hyphenated branch names:

- `feature/document-preview`
- `fix/upload-validation`
- `backend/health-version`
- `frontend/dashboard-accessibility`
- `docs/backend-setup`
- `test/request-id-middleware`
- `chore/update-dependencies`

## Install and Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The API runs at `http://localhost:5000` and the dashboard runs at `http://localhost:5173` by default. Copy values from the relevant `.env.example`; never commit a real `.env` file.


## Test and Format Before Submitting

```bash
cd backend
npm run format:check

## Test Before Submitting

```bash
cd backend

npm test

cd ../frontend
npm run build
```

Add or update tests for changed behavior. Run `npm run format` in the backend if there are any style check failures. Manually verify affected user flows and report any check you could not run.

Add or update tests for changed behavior. Manually verify affected user flows and report any check you could not run.


## Code Style

- Follow the existing JavaScript and React patterns.
- Use ES modules and descriptive names.
- Keep controllers focused on HTTP translation and services focused on business rules.
- Keep React components accessible, responsive, and keyboard usable.
- Normalize API errors; do not expose stack traces or sensitive values.
- Do not change authorization or ownership behavior without explicit maintainer approval.
- Avoid unrelated formatting and generated files.
- Update documentation and environment examples when interfaces change.

## Commit Messages

Use short, imperative messages:

```text
add document status filter
fix upload size validation
test request ID middleware
docs explain backend setup
```

Prefer one logical change per commit. Do not use vague messages such as `changes`, `fix`, or `update`.

## Submit a Pull Request

1. Sync your branch with the current ECSoC base.
2. Push the branch to your fork.
3. Open a pull request with `ecsoc-2026` selected as the base.
4. Complete every relevant section of the pull request template.
5. Link the assigned issue with `Closes #123`.
6. Include screenshots for visible changes and exact test commands.
7. Respond respectfully to review feedback and keep the branch updated.

```bash
git fetch upstream
git rebase upstream/ecsoc-2026
git push -u origin type/short-description
```

Maintainers merge reviewed ECSoC work into `ecsoc-2026` and periodically promote stable changes to `main`.

## Review Expectations

A pull request is ready when it is focused, tested, documented, secure, and passes required checks. Maintainers may request changes, split oversized work, or close inactive contributions. Resolve review conversations only after the underlying concern is addressed.

## Community

Quality and collaboration matter more than pull-request count. Ask focused questions, help other contributors, and consider [starring CertiVault](https://github.com/Krishnx21/CertiVault) and [following the Project Admin](https://github.com/Krishnx21).
