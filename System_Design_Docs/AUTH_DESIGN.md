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
| POST | `/api/auth/register` | Public | Create account, returns token pair |
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

Default role for new registrations: `validation_engineer`.

Use `requireRole(...roles)` middleware factory to gate routes.

---

## User Model Fields

```
email           String  unique, indexed
name            String
passwordHash    String  bcrypt (12 rounds)
role            Enum    UserRole
refreshTokenHash String | null  bcrypt hash of current refresh token
isActive        Boolean default true
lastLoginAt     Date | null
createdAt       Date    auto
updatedAt       Date    auto
```

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
| `src/features/auth/pages/SignupPage.tsx` | Registration form |
| `src/shared/components/ProtectedRoute.tsx` | Redirects unauthenticated users |
| `src/shared/components/RoleGuard.tsx` | Conditionally renders by role |
