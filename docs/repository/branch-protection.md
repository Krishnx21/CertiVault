# Branch Protection Recommendations

Apply these rules to `main` and, during ECSoC 2026, to `ecsoc-2026`.

| Rule | Recommendation | Why it exists |
| --- | --- | --- |
| Require pull requests | Enabled | Keeps every change reviewable and auditable. |
| Required approvals | At least 1 approval | Prevents unreviewed changes from landing. |
| Dismiss stale approvals | Enabled | Ensures approvals still apply after new commits. |
| Require conversation resolution | Enabled | Prevents unresolved review concerns from being merged. |
| Require status checks | Enabled | Blocks merges when CI, security, or quality gates fail. |
| Require branches to be up to date | Enabled for protected release branches | Reduces surprise failures after merge. |
| Require linear history | Enabled | Keeps history easier to audit and bisect. |
| Block force pushes | Enabled | Protects shared branch history. |
| Restrict deletions | Enabled | Prevents accidental removal of protected branches. |
| Require merge queue | Optional, recommended when contribution volume grows | Serializes tested merge groups and reduces broken main incidents. |

Recommended required checks:

- `CI / Backend build and test`
- `CI / Frontend build`
- `Quality gates / Markdown lint`
- `Quality gates / YAML validation`
- `Security / CodeQL`
- `Security / Node security audit`
- `Pull request governance / Conventional PR title`
- `Pull request governance / Branch name validation`

For external forks, keep maintainer approval required before running workflows
that use elevated repository permissions.
