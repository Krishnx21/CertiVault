# CertiVault Auth — Execution Plan

## Goal

Implement a production-ready authentication system for CertiVault using the current React + TypeScript + Express + MongoDB architecture, without redesigning the UI or removing any existing functionality.

## Recommended Approach

- Keep access tokens in frontend memory and send them through `Authorization: Bearer ...`.
- Keep refresh tokens only in secure `HttpOnly` cookies and rotate them on every refresh.
- Use MongoDB `RefreshSession` records with hashed refresh-token storage, family tracking, revocation, and reuse detection.
- Use Passport only for Google OAuth redirect/callback handling; keep API auth middleware custom and JWT-based.
- Use Resend for verification and password-reset emails with hashed one-time tokens and expirations.
- Reuse the existing frontend shell and styling by adding auth routes, providers, and pages around the current dashboard layout.

## File Plan

### Backend

- Update `backend/src/config/env.ts`
  - Add validated auth/email/OAuth/cookie variables:
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

- Add `backend/.env.example`
  - Document the full auth/email/OAuth configuration required for local and production setups.

- Update `backend/src/modules/users/user.model.ts`
  - Support local and Google auth with:
    - `authProvider`
    - `googleId`
    - `passwordChangedAt`
    - optional `passwordHash` for Google-only accounts
  - Keep existing lockout, verification, and reset-token behavior.
  - Add helper methods for failed-login tracking, lock resets, and safe password updates.

- Update `backend/src/modules/auth/refreshSession.model.ts`
  - Add:
    - `sessionId`
    - `familyId`
    - `replacedBySessionId`
    - `lastUsedAt`
    - `revocationReason`
  - Preserve hashed refresh-token storage and TTL expiry.

- Add `backend/src/middleware/validate.ts`
  - Generic Zod middleware that validates and rewrites `body`, `params`, and `query`.

- Add `backend/src/middleware/authenticate.ts`
  - Verify bearer access tokens, load the active user, and attach typed `req.user`.

- Add `backend/src/middleware/authenticateRefresh.ts`
  - Verify the refresh cookie, load the matching session, and attach refresh context for rotation/logout.

- Add `backend/src/middleware/authorize.ts`
  - Enforce role-based access for admin and verifier operations.

- Add `backend/src/types/express.d.ts`
  - Type `req.user` and refresh-session context across controllers and middleware.

- Add `backend/src/modules/auth/auth.validation.ts`
  - Zod schemas for:
    - register
    - login
    - logout
    - logout-all
    - refresh
    - forgot-password
    - reset-password
    - verify-email
    - resend-verification
    - change-password

- Add `backend/src/modules/auth/auth.tokens.ts`
  - JWT creation and verification for access and refresh tokens.
  - Include user/session claims needed for protected middleware and rotation.

- Add `backend/src/modules/auth/auth.cookies.ts`
  - Centralized cookie set/clear helpers using environment-driven `secure`, `sameSite`, `domain`, and `httpOnly`.

- Add `backend/src/services/email/resend.client.ts`
  - Thin Resend client wrapper.

- Add `backend/src/services/email/email.templates.ts`
  - Verification-email and reset-password templates.

- Add `backend/src/modules/auth/auth.service.ts`
  - Single source of truth for:
    - register
    - verify email
    - resend verification
    - login
    - refresh rotation
    - logout
    - logout all
    - forgot password
    - reset password
    - change password
    - current user lookup
    - Google login/linking

- Add `backend/src/modules/auth/google.strategy.ts`
  - Passport Google OAuth strategy with normalized email matching and account linking.

- Add `backend/src/modules/auth/auth.controller.ts`
  - Thin request/response adapters that delegate to the service layer.

- Add `backend/src/modules/auth/auth.routes.ts`
  - Endpoints:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `POST /api/auth/logout`
    - `POST /api/auth/logout-all`
    - `POST /api/auth/refresh`
    - `POST /api/auth/forgot-password`
    - `POST /api/auth/reset-password`
    - `POST /api/auth/verify-email`
    - `POST /api/auth/resend-verification`
    - `POST /api/auth/change-password`
    - `GET /api/auth/me`
    - `GET /api/auth/google`
    - `GET /api/auth/google/callback`

- Update `backend/src/middleware/errorHandler.ts`
  - Normalize `AppError`, `ApiError`, Zod validation failures, JWT errors, Passport failures, and duplicate-key errors into one JSON format.

- Update `backend/src/app.ts`
  - Initialize Passport.
  - Mount `authRouter`.
  - Keep `/api/auth` rate limiting.
  - Add missing security middleware that works with the current stack.
  - Protect dashboard and document routes after auth middleware is ready.

- Update `backend/src/modules/documents/document.routes.ts`
  - Require authentication for all document routes.
  - Add role checks for verification actions.
  - Apply Zod validation around query, params, and upload metadata.

- Update `backend/src/modules/documents/document.controller.ts`
  - Remove hardcoded identity fields.
  - Use authenticated user context for owner and authorization checks.

- Update `backend/src/modules/documents/document.model.ts`
- Update `backend/src/modules/documents/document.store.ts`
  - Store ownership information in a way that can be scoped to the logged-in user.

- Update `backend/src/modules/dashboard/dashboard.routes.ts`
  - Require authentication and return data scoped to the current user or role.

### Frontend

- Update `frontend/src/main.tsx`
  - Mount `BrowserRouter` and `AuthProvider`.

- Update `frontend/src/App.tsx`
  - Replace the single-page implementation with route declarations only.

- Add `frontend/src/auth/auth-types.ts`
  - Shared auth state and API payload types.

- Add `frontend/src/auth/AuthProvider.tsx`
  - Own in-memory access token storage, current user state, bootstrap, refresh, login, and logout behavior.

- Add `frontend/src/auth/ProtectedRoute.tsx`
  - Block protected screens until auth bootstrap completes.

- Add `frontend/src/auth/PublicOnlyRoute.tsx`
  - Redirect authenticated users away from login/register/reset flows.

- Add `frontend/src/layouts/AppLayout.tsx`
  - Reuse the current shell layout around routed protected pages.

- Add `frontend/src/pages/DashboardPage.tsx`
  - Move the existing dashboard logic out of the current monolithic `App.tsx`.

- Add `frontend/src/pages/LoginPage.tsx`
- Add `frontend/src/pages/RegisterPage.tsx`
- Add `frontend/src/pages/ForgotPasswordPage.tsx`
- Add `frontend/src/pages/ResetPasswordPage.tsx`
- Add `frontend/src/pages/VerifyEmailPage.tsx`
- Add `frontend/src/pages/GoogleAuthCallbackPage.tsx`
  - Implement fully functional auth screens without redesigning the existing UI language.

- Add `frontend/src/api/http.ts`
  - Shared auth-aware fetch client with:
    - `credentials: "include"`
    - bearer token attachment
    - serialized refresh attempts
    - one-time request retry after refresh
    - session clearing when refresh fails

- Add `frontend/src/api/auth.ts`
  - Frontend auth API bindings for all auth endpoints.

- Add `frontend/src/api/documents.ts`
- Add `frontend/src/api/dashboard.ts`
  - Move existing business endpoints behind the auth-aware transport layer.

- Update `frontend/src/api.ts`
  - Convert into a re-export shim or remove once imports are migrated.

- Update `frontend/src/components/Topbar.tsx`
  - Replace hardcoded profile data and add a working logout/profile menu.

- Update `frontend/src/components/Sidebar.tsx`
  - Replace hardcoded user details with live data while preserving the current UI structure.

- Update `frontend/src/components/UploadModal.tsx`
  - Use the new auth-aware API client.

- Update `frontend/src/styles.css`
  - Add only the styles needed for auth screens, loading states, and form feedback, reusing the current design system.

## Execution Order

1. Expand backend env handling, request typing, validation middleware, and error normalization.
2. Extend user/session persistence models for Google auth, rotation metadata, and password lifecycle tracking.
3. Implement local auth backend: register, verify email, login, refresh, logout, logout-all, and `/me`.
4. Implement forgot/reset/change password and Resend email delivery/templates.
5. Implement Google OAuth login/linking and callback handling.
6. Protect dashboard and document routes and remove hardcoded identity assumptions.
7. Refactor the frontend into routed auth-aware pages and layouts without redesigning the UI.
8. Add auth provider, protected/public routes, refresh persistence, and retrying API client behavior.
9. Connect live user state to the profile UI and logout flow.
10. Run typechecks, backend integration tests, and end-to-end manual verification.

## Key Risks

- `passwordHash` is currently required, so Google-only account support requires schema updates before OAuth work.
- Document ownership is not modeled strongly enough yet for per-user authorization; protected routes alone are not sufficient.
- Cookie persistence can fail in local development if `SameSite`, `Secure`, callback URL, and CORS are not aligned.
- Refresh retry logic must deduplicate concurrent `401` failures or uploads and mutations can behave unpredictably.
- Current error handling is too narrow for Zod, JWT, Passport, and duplicate-key failures.
- Existing tests and scripts do not yet cover auth/session behavior, so integration coverage needs to expand before relying on manual checks alone.

## Verification

### Automated

- Run backend typecheck and frontend typecheck/build.
- Add backend integration coverage for:
  - register
  - verify email
  - login
  - refresh rotation
  - refresh-token reuse detection
  - logout
  - logout-all
  - forgot password
  - reset password
  - change password
  - `/me`
  - protected routes
  - Google callback happy path

### Manual

- Register creates a user and sends a verification email.
- Verify email marks the account as verified.
- Login sets the refresh cookie and returns access token plus user data.
- `/me` returns the current user for a valid bearer token.
- Refresh rotates the session and keeps the user signed in after browser refresh.
- Logout clears the session cookie and removes access to protected pages.
- Forgot password sends a reset email with a working token.
- Reset password updates credentials and revokes old sessions.
- Change password requires the current password and rotates out older sessions.
- Google login creates or links accounts correctly.
- Protected routes reject anonymous users.
- Role middleware blocks unauthorized roles.
- Dashboard and document requests work only for authenticated users.
