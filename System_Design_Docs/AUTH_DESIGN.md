# Authentication & Authorization Design

## Overview

JWT-based stateless authentication with refresh token rotation, RBAC (7 roles), and immutable audit logging. Designed for 21 CFR Part 11 and ALCOA+ compliance readiness.

---

## Token Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access JWT | 15 minutes | Frontend memory (Zustand, not persisted to disk) |
| Refresh JWT | 7 days | Zustand persist (localStorage), hash stored in MongoDB |

Refresh tokens are rotated on every use — the previous token is immediately invalidated.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Create account (disabled when `REGISTRATION_ENABLED=false`) |
| POST | `/api/auth/login` | Public | Verify credentials, returns token pair |
| POST | `/api/auth/refresh` | Public | Rotate refresh token, returns new pair |
| POST | `/api/auth/logout` | Bearer | Clear refresh token hash |

---

## RBAC Roles

| Role | Value |
|------|-------|
| Super Admin | `super_admin` |
| QA Reviewer | `qa_reviewer` |
| Validation Head | `validation_head` |
| Validation Engineer | `validation_engineer` |
| Calibration Engineer | `calibration_engineer` |
| Customer | `customer` |
| Auditor | `auditor` |

Self-registration (when `REGISTRATION_ENABLED=true`): creates stub org + `super_admin` user.

Admin-created users inherit the creator's `organizationId`.

Use `requireRole(...roles)` middleware factory to gate routes.

---

## Public Registration Gate

Public self-registration is disabled by default.

| Setting | Default | Effect |
|---------|---------|--------|
| `REGISTRATION_ENABLED` | `false` | `POST /api/auth/register` returns `403 Registration is disabled` |

Set `REGISTRATION_ENABLED=true` in `.env.<NODE_ENV>` to re-enable the register endpoint. The signup UI is hidden and `/signup` redirects to `/login` regardless.

### Provisioning Super Admins

While registration is disabled, create super admins via CLI:

```bash
pnpm script:create-super-admin --email admin@example.com --name "Admin User" --password 'SecurePass123'
```

- Creates a `super_admin` user with bcrypt-hashed password (12 rounds).
- Sets `onboardingCompleted: false` when no organization exists (user completes onboarding after first login).
- Sets `onboardingCompleted: true` when an organization already exists.

---

## User Model Fields

```
email           String  unique, indexed
name            String
passwordHash    String  bcrypt (12 rounds)
role            Enum    UserRole
organizationId  ObjectId ref Organization required, indexed
refreshTokenHash String | null  bcrypt hash of current refresh token
isActive        Boolean default true
onboardingCompleted Boolean default false
lastLoginAt     Date | null
createdAt       Date    auto
updatedAt       Date    auto
```

JWT access payload: `sub`, `email`, `role`, `organizationId`, optional `customerId`.

---

## Audit Log Events

Every auth action writes an immutable `AuditLog` document:

| Event | Trigger |
|-------|---------|
| `auth.register` | Successful registration |
| `auth.login` | Successful login |
| `auth.login_failed` | Wrong password or inactive account |
| `auth.logout` | Logout endpoint called |
| `auth.token_refresh` | (reserved for future use) |

Audit logs are never updated or deleted.

---

## Frontend Auth Flow

```
App load
  └── useAuthStore rehydrates from localStorage
       ├── token present → render protected route
       └── no token → redirect /login

API call
  └── request interceptor attaches Authorization: Bearer <accessToken>
       └── 401 response
            ├── silent refresh (POST /api/auth/refresh)
            │    ├── success → retry original request with new token
            │    └── failure → clearAuth() + redirect /login
            └── non-401 errors propagate normally
```

---

## Key Files

### Backend

| File | Role |
|------|------|
| `src/modules/auth/auth.service.ts` | Core logic: bcrypt, JWT sign/verify, token rotation |
| `src/modules/auth/auth.route.ts` | Route definitions |
| `src/modules/user/user.model.ts` | Mongoose schema with `UserRole` enum |
| `src/modules/audit/audit.service.ts` | Write-only audit log |
| `src/middlewares/auth.middleware.ts` | JWT verification, sets `req.user` |
| `src/middlewares/rbac.middleware.ts` | `requireRole()` factory for route-level RBAC |
| `src/config/database.ts` | Mongoose connect/disconnect |

### Frontend

| File | Role |
|------|------|
| `src/app/store/useAuthStore.ts` | Persisted Zustand store (tokens + user) |
| `src/services/apiClient.ts` | Axios with auth injection + silent refresh |
| `src/features/auth/pages/LoginPage.tsx` | Login form (react-hook-form + Joi) |
| `src/features/auth/pages/SignupPage.tsx` | Registration form (route redirects to login while signup is hidden) |
| `scripts/create-super-admin.ts` | CLI to provision super admin users |
| `src/shared/components/ProtectedRoute.tsx` | Redirects unauthenticated users |
| `src/shared/components/RoleGuard.tsx` | Conditionally renders by role |
