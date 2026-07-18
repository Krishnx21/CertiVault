<div align="center">

# CertiVault

### Smart Document Management and Verification Platform

A secure, cloud-native document vault built for trust, traceability, and effortless sharing.

**Upload once. Find instantly. Verify confidently. Share safely. Track everything.**

![version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![license](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![node](https://img.shields.io/badge/node-20%2B-brightgreen?style=for-the-badge&logo=node.js)
![typescript](https://img.shields.io/badge/TypeScript-strict-blue?style=for-the-badge&logo=typescript)
![docker](https://img.shields.io/badge/docker-ready-blue?style=for-the-badge&logo=docker)
![kubernetes](https://img.shields.io/badge/kubernetes-ready-326CE5?style=for-the-badge&logo=kubernetes)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)
![workflows](https://img.shields.io/badge/GitHub%20Actions-21%20workflows-orange?style=for-the-badge&logo=github-actions)

[Features](#features) · [Architecture](#architecture) · [Quick Start](#quick-start) · [API](#api-reference) · [Deployment](#deployment) · [Contributing](#contributing)

</div>

---

## What Is CertiVault

CertiVault is a production-grade document management and verification platform that solves a real problem — important documents like certificates, contracts, IDs, and compliance records are stored across email threads, local folders, and generic cloud drives with no verification, no access control, and no audit trail.

CertiVault replaces that chaos with a single secure platform where documents are uploaded once, indexed and searchable, cryptographically verified, shared only to trusted members with role-based access, and every meaningful action is permanently recorded.

---

## The Problem It Solves

```
Traditional document storage:
  Upload → Store → Download
  No verification. No access control. No audit trail.

CertiVault:
  Upload → Protect → Index → Verify → Share → Audit → Alert
  Cryptographic hashes. Vault-level access control.
  Full audit trail. Expiry reminders. QR verification.
```

**Real use cases:**

| Use Case | How CertiVault Helps |
|----------|---------------------|
| Academic credentials | Institutions verify certificates. Graduates share access to trusted reviewers. |
| Employee records | HR teams organize contracts, IDs, certifications with expiry tracking. |
| Legal documents | Sensitive agreements with scoped access and complete audit logs. |
| Vendor compliance | Collect and review licenses, insurance, compliance evidence in one place. |
| Personal vault | One searchable source of truth for identity and financial documents. |

---

## Features

### Document Management
- Upload PDFs, images, and documents with automatic SHA-256 and MD5 checksum generation
- Dual storage: AWS S3 as primary, Cloudinary as secondary, local filesystem as fallback
- Rich metadata — titles, tags, categories, expiry dates, custom metadata fields
- Full-text search across all documents
- Filter by verification status, category, date range, favorites, archived state
- Soft delete with archive and restore
- Document preview without leaving the platform
- Presigned S3 URLs for secure, time-limited downloads

### Trust and Verification
- Four verification states: pending, verified, rejected, expired
- Manual verification by admin and verifier roles
- QR code generation per document for physical verification
- Public verification endpoint — anyone with the link can verify authenticity without an account
- Verification history with full audit trail per document
- Cryptographic hash comparison to detect document tampering or duplication

### Vault Member System
- Add trusted people as secondary members of your entire document vault
- Two roles: Viewer (read and download) and Editor (read, download, and upload)
- Email-based invite system with 24-hour expiry tokens
- Members accept or decline invites from their dashboard
- Owners can change roles or remove members at any time
- Members can leave vaults themselves
- Full notification system for every invite and membership event

### Background Jobs and Workers
- BullMQ job queues for all async operations
- Email worker handles: welcome emails, email verification, password reset, vault invites, expiry reminders
- Notification worker handles: in-app notification creation and delivery
- Bull Board admin UI for queue monitoring and job inspection
- Daily expiry-reminder job for documents approaching their expiry date

### Security
- JWT access tokens (short-lived) with refresh token rotation
- Google OAuth 2.0 via Passport.js
- bcrypt password hashing with 12 rounds
- Brute-force lockout after 5 failed login attempts (15 minute lockout)
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- CSRF protection middleware
- Rate limiting on all routes, stricter on auth routes
- HTTP parameter pollution prevention
- NoSQL injection prevention via Mongoose typing and Zod validation
- Input sanitization with xss-clean and mongo-sanitize

### Observability
- Prometheus metrics exposed at `/metrics`
- Custom business metrics: documents uploaded, verifications, vault invites, auth failures
- Queue metrics: job depth, duration, completion rates
- Pre-built Grafana dashboard with 6 rows: HTTP, business activity, documents, queues, auth, vault members
- Alert rules for: error rate above 5%, queue depth above 100, response time above 2 seconds
- Winston structured JSON logging with request IDs
- Liveness and readiness health endpoints for Kubernetes probes

---

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Language | TypeScript (strict mode) |
| Database | MongoDB Atlas + Mongoose 9 |
| Auth | JWT access and refresh tokens, Google OAuth, Passport.js |
| Password | bcryptjs (12 rounds) |
| File Storage | AWS S3 + Cloudinary + local fallback |
| Cache | Redis via ioredis (Upstash) |
| Queue | BullMQ + Bull Board |
| Email | Nodemailer + Resend API |
| Validation | Zod + express-validator |
| Logging | Winston |
| Metrics | prom-client |
| Security | Helmet, CORS, express-rate-limit, HPP, CSRF, xss-clean, mongo-sanitize |
| QR Codes | qrcode |
| File Processing | multer + sharp |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite |
| Language | TypeScript |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Forms | react-hook-form + Zod |
| Icons | Lucide React |
| Styling | CSS3 + Tailwind CSS 3 |
| State | React Context + useReducer |

### Infrastructure

| Layer | Technology |
|-------|-----------|
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Orchestration | Kubernetes + Helm |
| IaC | Terraform (AWS) |
| CI/CD | GitHub Actions (21 workflows) |
| Registry | GitHub Container Registry |
| Monitoring | Prometheus + Grafana |
| Cloud | AWS (EKS, S3, ECR, ElastiCache, DocumentDB, VPC) |

---

## Architecture

```
Browser / Mobile
      ↓
  Nginx (reverse proxy, gzip, static cache)
      ↓
  React 19 + Vite (frontend)
      ↓
  Express 5 API (backend, TypeScript)
      ↓
  ┌─────────────────────────────────────┐
  │          Services Layer             │
  │  Auth  Documents  Vault  Verify    │
  │  Notifications  Search  Dashboard  │
  └─────────────────────────────────────┘
      ↓             ↓           ↓
  MongoDB       Redis         AWS S3
  Atlas         (cache        (file
  (data)         + queues)     storage)
      ↓             ↓
  BullMQ        Workers
  Queues    (email + notification)
      ↓
  Prometheus → Grafana
  (metrics)   (dashboards)
```

---

## Quick Start

### Requirements

- Node.js 20 or higher
- Docker and Docker Compose
- Git

### One command setup

```bash
git clone https://github.com/krishnx21/certivault.git
cd certivault
cp backend/.env.example backend/.env
# Fill in your values in backend/.env
docker compose up --build
```

Everything starts automatically:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| Bull Board | http://localhost:5000/admin/queues |

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/certivault

# JWT
JWT_ACCESS_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_other_64_char_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=certivault-documents

# Redis (Upstash)
REDIS_URL=rediss://default:password@your-upstash-url:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=CertiVault <noreply@certivault.com>

# Bull Board
BULL_BOARD_USERNAME=admin
BULL_BOARD_PASSWORD=securepassword
```

---

## API Reference

### Authentication

```
POST  /api/auth/register              Register with email and password
POST  /api/auth/login                 Login, returns access and refresh tokens
POST  /api/auth/logout                Logout current device
POST  /api/auth/logout-all            Logout all devices
POST  /api/auth/refresh               Rotate refresh token
POST  /api/auth/forgot-password       Send password reset email
POST  /api/auth/reset-password        Set new password via token
POST  /api/auth/verify-email          Verify email via token
GET   /api/auth/google                Google OAuth redirect
GET   /api/auth/google/callback       Google OAuth callback
GET   /api/auth/me                    Get current user profile
```

### Documents

```
POST  /api/documents                  Upload document and file
GET   /api/documents                  List documents (paginated, filterable)
GET   /api/documents/:id              Get document detail
PATCH /api/documents/:id              Update metadata
DELETE /api/documents/:id             Soft delete document
POST  /api/documents/:id/archive      Archive document
POST  /api/documents/:id/restore      Restore archived document
POST  /api/documents/:id/favorite     Toggle favorite
GET   /api/documents/:id/download     Download (presigned S3 URL)
GET   /api/documents/recent           Recently accessed documents
GET   /api/documents/favorites        Favorite documents
GET   /api/documents/stats            Storage and count summary
```

### Verifications

```
POST  /api/verifications/:documentId/verify    Submit verification decision
POST  /api/verifications/:documentId/revoke    Revoke a verification
GET   /api/verifications/:documentId           Get verification detail
GET   /api/verifications/:documentId/history   Verification history
GET   /api/verifications/:documentId/qr        Generate QR code (base64)
GET   /api/verifications/list                  List all verifications
GET   /api/verifications/stats                 Verification statistics
GET   /public/verify/:token                    Public verification (no auth)
```

### Vault Members

```
POST   /api/vault/members                      Invite member by email
GET    /api/vault/members                      List my vault members
PATCH  /api/vault/members/:memberId            Change member role
DELETE /api/vault/members/:memberId            Remove member

GET    /api/vault/invites                      Pending invites for me
POST   /api/vault/invites/:token/accept        Accept an invite
POST   /api/vault/invites/:token/decline       Decline an invite
DELETE /api/vault/access/:vaultOwnerId         Leave a vault

GET    /api/vault/shared-with-me               Vaults I have access to
GET    /api/documents?vaultOwnerId=:id         Documents from shared vault
```

### Notifications

```
GET   /api/notifications              List notifications (paginated)
GET   /api/notifications/unread-count Unread notification count
PATCH /api/notifications/:id/read     Mark one as read
PATCH /api/notifications/read-all     Mark all as read
DELETE /api/notifications/:id         Delete one notification
DELETE /api/notifications             Delete all read notifications
```

### Search and Dashboard

```
GET   /api/search?q=query             Full-text document search
GET   /api/dashboard/stats            Dashboard statistics
GET   /api/dashboard/activity         Recent activity timeline
```

### Health and Monitoring

```
GET   /health/live                    Liveness probe
GET   /health/ready                   Readiness probe (MongoDB + Redis)
GET   /metrics                        Prometheus metrics endpoint
GET   /admin/queues                   Bull Board queue admin UI
```

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | /login | Email and password login with Google OAuth |
| Register | /register | Account creation |
| Forgot Password | /forgot-password | Password reset email |
| Reset Password | /reset-password | Set new password via token |
| Verify Email | /verify-email | Email verification via token |
| OAuth Callback | /auth/callback | Google OAuth token exchange |
| Dashboard | /dashboard | Stats, recent activity, quick actions |
| Documents | /documents | Full document list with search and filters |
| Document Detail | /documents/:id | Document view with tabs: Details, History, Verification |
| Verifications | /verification | All verifications with status filter |
| Verification Detail | /verification/:documentId | Verify document, view QR code, history |
| Public Verify | /public/verify/:token | Unauthenticated public verification page |
| Vault Members | /vault/members | Manage vault members (invite, roles, remove) |
| Shared Vaults | /vault/shared | Vaults shared with you, pending invites |
| Shared Vault Docs | /vault/shared/:ownerId/documents | Browse a shared vault |
| Settings | /settings | Profile, password, notification preferences |

---

## CI/CD Pipelines (21 Workflows)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ci.yml | push and PR | Build, typecheck, lint, test |
| coverage.yml | push | Test coverage report |
| quality.yml | push and PR | ESLint and Prettier |
| security.yml | push and PR | npm audit for vulnerabilities |
| security-scan.yml | push | Trivy container scan → GitHub Security |
| docker-build.yml | push to main | Build and push images to GHCR (multi-platform) |
| k8s-deploy.yml | release | Deploy to Kubernetes cluster |
| terraform-plan.yml | PR | Run terraform plan, comment results |
| terraform-apply.yml | push to main | Apply Terraform changes |
| performance.yml | PR to main | k6 load test (spike and soak scenarios) |
| release.yml | tag | Create GitHub release and changelog |
| commit-message.yml | PR | Enforce conventional commits |
| pr-governance.yml | PR | Size labels, required reviewers |
| validate-pr-base.yml | PR | Prevent direct merges to main |
| labeler.yml | PR | Auto-label by file path |
| issue-labeler.yml | issues | Auto-label issues |
| stale.yml | schedule | Close stale issues and PRs |
| community.yml | issues | Welcome new contributors |
| thank-merged-contributor.yml | PR merged | Thank contributor |
| sync-labels.yml | push | Sync repo labels from config |
| dependabot.yml | schedule | Automated dependency updates |

---

## Deployment

### Docker Compose (Local and Staging)

```bash
# Start all 7 services
docker compose up --build

# Production mode (pulls from GHCR, resource limits applied)
docker compose -f docker-compose.prod.yml up
```

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f kubernetes/

# Or use Helm
helm install certivault ./helm/certivault \
  --namespace certivault \
  --create-namespace \
  -f helm/certivault/values.prod.yaml

# Verify deployment
kubectl get pods -n certivault
```

### Terraform (AWS)

```bash
# One-time: create remote state bucket manually in AWS S3
# Then initialize
cd terraform
terraform init
terraform plan
terraform apply
```

AWS resources provisioned:
- VPC with 2 public and 2 private subnets, IGW, NAT Gateway
- S3 bucket (encrypted, versioned, Glacier lifecycle)
- ECR repositories (backend and frontend)
- ElastiCache Redis cluster (private subnet)
- EKS cluster 1.29 with autoscaling node group
- DocumentDB cluster (encrypted, TLS, Secrets Manager)

---

## Project Status

| Area | Status |
|------|--------|
| Core application (auth, documents, verifications, search, dashboard) | Complete |
| Vault member system (invite, roles, shared access) | Complete |
| Background workers (email, notifications, expiry reminders) | Complete |
| Docker and Docker Compose | Complete |
| Prometheus metrics and Grafana dashboards | Complete |
| Kubernetes and Helm | Complete |
| GitHub Actions CI/CD (21 workflows) | Complete |
| Terraform AWS infrastructure | Complete |
| MFA / TOTP | Dependency installed, not yet wired |
| Audit and verification report export | Not built |
| Automated MongoDB backup | Not configured |

---

## Contributing

CertiVault is open source under ECSoC 2026. Contributions are welcome.

Good first issues:

| Task | Difficulty |
|------|-----------|
| Write missing unit tests | Easy |
| Add PDF export for audit reports | Medium |
| Wire up MFA with speakeasy | Medium |
| Add document version history | Medium |
| Improve mobile responsiveness | Easy |

Before contributing:

```bash
git clone https://github.com/krishnx21/certivault.git
cd certivault
cp backend/.env.example backend/.env
docker compose up mongodb redis -d
cd backend && npm install && npm run dev
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for code standards and the PR process.

---

## License

MIT License. See [LICENSE](./LICENSE) for full terms.

---

<div align="center">

Built by [Krishna Kumar](https://github.com/krishnx21)

*Part of the portfolio: CertiVault → SecretSentinel → PipelineGuard → OpsPilot*

If CertiVault is useful to you, give it a star.

</div>
