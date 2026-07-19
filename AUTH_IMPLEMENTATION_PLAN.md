# CertiVault Auth — Implementation Plan

## Goal

Implement a production-ready authentication system for CertiVault without redesigning the UI, removing existing functionality, or bypassing the current React + TypeScript + Express + MongoDB architecture.

## Key Decisions

- Keep access tokens in frontend memory and send them as `Authorization: Bearer ...`.
- Keep refresh tokens only in secure `HttpOnly` cookies and rotate them on every refresh.
- Use MongoDB `RefreshSession` records with hashed token storage, session revocation, and reuse detection.
- Use Passport Google OAuth only for browser redirect/callback flow; keep API auth middleware custom and JWT-based.
- Use Resend for verification and password reset emails with hashed one-time tokens and expirations.
- Reuse the current frontend visual language by adding auth pages and session state around the existing dashboard shell instead of redesigning it.

## Backend Work

### 1. Auth module

Create a full `backend/src/modules/auth` module:

- `auth.routes.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `auth.validation.ts`
- `auth.tokens.ts`
- `auth.cookies.ts`
- `auth.email.ts`
- `google.strategy.ts`

Implement endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

### 2. User and session persistence

Update `backend/src/modules/users/user.model.ts` to support:

- local auth + Google auth
- `googleId`
- `authProvider`
- `passwordChangedAt`
- hashed verification/reset tokens and expiry fields
- active/verified/lockout state enforcement

Update `backend/src/modules/auth/refreshSession.model.ts` to support:

- `sessionId`
- `familyId`
- `replacedBySessionId`
- `lastUsedAt`
- `revocationReason`

Store only hashed refresh tokens, reset tokens, and verification tokens.

### 3. Middleware and validation

Add:

- `backend/src/middleware/validate.ts`
- `backend/src/middleware/authenticate.ts`
- `backend/src/middleware/authenticateRefresh.ts`
- `backend/src/middleware/authorize.ts`
- `backend/src/middleware/requireCsrf.ts`
- `backend/src/types/express.d.ts`

Use Zod on every auth route and protected business route. Attach typed `req.user` and refresh-session context. Enforce protected middleware on documents and dashboard routes after auth is in place.

### 4. Security integration

Extend existing backend security instead of replacing it:

- keep Helmet, CORS, HPP, cookie parser, rate limiting
- add CSRF double-submit protection for refresh/logout flows
- keep credentialed CORS
- ensure secure cookie flags depend on environment
- return consistent JSON errors with proper HTTP status codes
- extend `backend/src/middleware/errorHandler.ts` to serialize `AppError` as well as `ApiError`

### 5. Email and OAuth

Add Resend integration:

- `backend/src/services/email/resend.client.ts`
- `backend/src/services/email/email.templates.ts`

Implement:

- verification email template
- password reset email template
- hashed verification/reset token generation
- expiry enforcement

Implement Google OAuth with Passport:

- state validation
- registration or login on callback
- existing-account linking by normalized email
- refresh session creation
- JWT issuance without leaking tokens into redirect URLs

### 6. App wiring

Update `backend/src/app.ts` to:

- initialize Passport
- mount `authRouter`
- keep `/api/auth` rate limits
- protect `documentRouter` and `dashboardRouter`

Update document/dashboard handlers to stop using hardcoded identity data and instead rely on authenticated user context.

## Frontend Work

### 1. Routing and auth shell

Add `react-router-dom` and split the current single-page app into:

- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/ForgotPasswordPage.tsx`
- `frontend/src/pages/ResetPasswordPage.tsx`
- `frontend/src/pages/VerifyEmailPage.tsx`
- `frontend/src/pages/GoogleAuthCallbackPage.tsx`

Update:

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`

Use:

- `ProtectedRoute`
- `PublicOnlyRoute`

Do not redesign existing UI. Reuse current layout, colors, buttons, card styles, and overall structure.

### 2. Auth state management

Add:

- `frontend/src/auth/AuthProvider.tsx`
- `frontend/src/auth/ProtectedRoute.tsx`
- `frontend/src/auth/PublicOnlyRoute.tsx`
- `frontend/src/auth/auth-types.ts`

Implement:

- auth bootstrap on app load
- `/refresh` call with cookie credentials
- `/me` fetch after refresh/login
- in-memory access token storage
- persistent logged-in experience across page refreshes through refresh cookie
- session clearing on logout

### 3. API client

Refactor `frontend/src/api.ts` into an auth-aware client or split into:

- `frontend/src/api/http.ts`
- `frontend/src/api/auth.ts`
- `frontend/src/api/documents.ts`

Requirements:

- always send `credentials: "include"`
- attach bearer access token when present
- auto-refresh on `401`
- serialize refresh attempts so only one refresh runs at a time
- retry original request after successful refresh
- clear auth state and redirect to login if refresh fails

### 4. Existing UI integration

Update:

- `frontend/src/components/Topbar.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/App.tsx`
- current dashboard logic moved into routed page components

Replace hardcoded user labels with live user data. Add functional profile/logout menu behavior. Keep current layout and styling intact.

### 5. Validation and messages

Implement:

- frontend field validation consistent with backend rules
- loading states on all auth actions
- inline error messages
- success messages for verification/reset flows
- protected-route loading screen during auth bootstrap

## Environment Variables

Backend env additions/confirmation:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SESSION_COOKIE_NAME`
- `FRONTEND_ORIGIN`
- `BCRYPT_ROUNDS`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_SECURE`
- `EMAIL_VERIFICATION_TTL_MINUTES`
- `PASSWORD_RESET_TTL_MINUTES`
- `LOGIN_MAX_FAILED_ATTEMPTS`
- `LOGIN_LOCK_MS`

Frontend env confirmation:

- `VITE_API_URL`

Also add a proper `backend/.env.example` and remove any real secrets from tracked env files during execution.

## Critical Files To Modify

Backend:

- `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/modules/users/user.model.ts`
- `backend/src/modules/auth/refreshSession.model.ts`
- `backend/src/modules/documents/document.routes.ts`
- `backend/src/modules/documents/document.controller.ts`
- `backend/src/modules/dashboard/dashboard.routes.ts`
- new auth and email files listed above

Frontend:

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/api.ts` or new API split files
- `frontend/src/components/Topbar.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/styles.css`
- new auth/layout/page files listed above

## Execution Order

1. Harden env handling, auth error handling, request typing, and validation middleware.
2. Implement local auth backend: register, verify email, login, refresh, logout, me.
3. Implement forgot/reset password and Resend templates.
4. Implement Google OAuth login/linking and callback flow.
5. Protect dashboard and document routes with auth/role middleware and remove hardcoded identity values.
6. Add frontend router, auth provider, protected/public routes, and auth-aware API client.
7. Add login/register/forgot/reset/verify/callback pages without redesigning the interface.
8. Connect profile menu, logout, and authenticated user rendering.
9. Run full backend/frontend typechecks and auth integration tests, then manual end-to-end verification.

## Verification Plan

### Automated

Backend:

- add unit tests for JWT utilities, cookie helpers, validation, and CSRF middleware
- add integration tests for register, verify email, login, refresh rotation, logout, logout-all, forgot password, reset password, Google callback flow, `/me`, and protected routes

Frontend:

- run TypeScript builds/typechecks after auth integration

### Manual

Verify the following end-to-end:

- register creates a user and sends verification email
- verify email activates the account
- login sets refresh cookie and returns access token + user
- `/me` returns the current user with bearer auth
- refresh rotates refresh token and keeps session alive after browser refresh
- logout clears cookies and blocks protected pages
- forgot password sends reset email
- reset password updates credentials and revokes old sessions
- Google login creates or links accounts correctly
- protected routes block anonymous users
- role middleware blocks unauthorized roles
- expired access token auto-refreshes in the frontend
- document and dashboard requests work only when authenticated
