# Contributing to CertiVault

Thank you for helping build a secure, trustworthy document platform. CertiVault
is participating in **Elite Coders Summer of Code (ECSoC) 2026**, and
[Krishna Kumar](https://github.com/Krishnx21) is the **Project Admin**.

## Before You Start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md).
- Search existing issues and pull requests before proposing duplicate work.
- Comment on the issue you want to address and wait for assignment before coding.
- For a new feature, open an issue and agree on the approach with a maintainer.
- Never post vulnerabilities in public issues; follow the private reporting policy.

## Development Workflow

1. Fork the repository and clone your fork.
2. Add the main repository as the `upstream` remote.
3. Create a focused branch from the latest `main` branch.
4. Make a small, reviewable change with relevant tests and documentation.
5. Run the available checks locally.
6. Push the branch to your fork and open a pull request against `main`.

```bash
git clone https://github.com/YOUR-USERNAME/CertiVault.git
cd CertiVault
git remote add upstream https://github.com/Krishnx21/CertiVault.git
git fetch upstream
git switch -c feature/short-description upstream/main
```

Use descriptive branch names such as `feature/document-search`,
`fix/upload-validation`, or `docs/security-guide`.

## Commits and Pull Requests

- Write clear, imperative commit messages, such as `add document upload validation`.
- Keep unrelated changes in separate pull requests.
- Explain what changed, why it changed, and how it was tested.
- Link the related issue with `Closes #123` when appropriate.
- Include screenshots for visible interface changes.
- Respond respectfully to review feedback and resolve conversations only after the
  concern has been addressed.
- Do not add generated files, secrets, credentials, or unrelated formatting.

Maintainers may request changes, close inactive pull requests, or ask that an
oversized change be split. A pull request is merged only after required reviews
and checks pass.

## Testing Expectations

Add or update tests for changed behavior. Until application code is introduced,
documentation contributions should verify headings, links, spelling, diagrams,
and consistency with the architecture. State any checks that could not be run.

## ECSoC 2026 Contributors

- Register through the official [ECSoC 2026 website](https://summerofcode.xyz).
- Follow ECSoC rules as well as this repository's contribution process.
- Do not submit copied, spam, empty, or artificial pull requests for activity.
- Quality, collaboration, and learning matter more than pull-request count.
- Ask questions on the relevant issue so decisions remain visible to everyone.

After contributing, consider **[starring CertiVault](https://github.com/Krishnx21/CertiVault)**
and **[following the Project Admin](https://github.com/Krishnx21)**.
