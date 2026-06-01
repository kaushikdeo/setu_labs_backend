# Security Audit — setu_labs

**Date:** May 2026  
**Scope:** setu_labs_backend + setu_labs_frontend  
**Method:** Static code review

---

## Summary

| Severity | Count |
|---|---|
| Critical | 2 |
| High | 12 |
| Medium | 11 |
| Low | 5 |

---

## Priority Remediation

1. **Rotate MongoDB URI + JWT secrets.** Add `.env.development` to `.gitignore` immediately. (SEC-001)
2. **Redact `req.body` from error logger globally.** Never log auth request payloads. (DATA-001)
3. **Disable or admin-gate `POST /api/auth/register` and `/signup` in production.** (AUTH-001, FE-001)
4. **Move `accessToken` to memory-only (no persist). Store `refreshToken` in `httpOnly` cookie.** (AUTH-003)
5. **Add `helmet` + restrictive CORS origin allowlist + `express-rate-limit` on auth routes.** (API-001, API-002, API-003)
6. **Fix visit query injection: whitelist allowed query params. Remove `unknown(true)` from all write schemas.** (INPUT-001, INPUT-002)
7. **Enforce `requireRole` + resource ownership on all GET/PATCH/POST beyond `authenticate`.** (DATA-002, DATA-003, FE-004)
8. **Replace `new Function` formula evaluator with a safe expression library (e.g. `expr-eval`, `mathjs`).** (INPUT-003, INPUT-004)

---

## Findings

### Authentication & Authorization

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| AUTH-001 | High | Open self-registration grants internal role | `auth/auth.route.ts` | 10 |
| AUTH-002 | High | First-user super_admin race condition | `auth/auth.service.ts` | 56–57 |
| AUTH-003 | High | Access + refresh tokens persisted in localStorage | `store/useAuthStore.ts` | 15–34 |
| AUTH-004 | Medium | JWT role not revalidated against DB per request | `middlewares/auth.middleware.ts` | 19–23 |
| AUTH-005 | Medium | No rate limiting on login/register endpoints | `src/app.ts` | 18–31 |
| AUTH-006 | Medium | `customer` role exists but is never server-side restricted | `user/user.model.ts` | 3–10 |
| AUTH-007 | Medium | `createUserSchema` allows `super_admin` role assignment | `user/user.schema.ts` | 4–8 |
| AUTH-008 | Low | Frontend route guards are token-presence only | `src/app/App.tsx` | 238–243 |

**AUTH-001:** `POST /api/auth/register` is unauthenticated. Any user can register and receive the `validation_engineer` role.

**AUTH-002:** Role assigned via `countDocuments()` without transaction. Concurrent registrations can produce multiple `super_admin` accounts.

**AUTH-003:** Zustand `persist` stores both `accessToken` and `refreshToken` in `localStorage` under `auth-state`. Any XSS exfiltrates both. Contradicts `AUTH_DESIGN.md` documentation.

**AUTH-004:** `authenticate` trusts JWT payload role until expiry (~15 min). Demoted/deactivated users remain authorized until token expires.

**AUTH-007:**
```ts
role: Joi.string().valid(...Object.values(UserRole)).optional()
```

---

### Input Validation & Sanitization

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| INPUT-001 | High | NoSQL injection via unvalidated visit query object | `visit/visit.controller.ts` | 8–11 |
| INPUT-002 | High | Mass assignment via `unknown(true)` on visit/task schemas | `visit/visit.schema.ts` | 3–10, 26–37 |
| INPUT-003 | High | Client-side code execution via `new Function` on formula strings | `visits/pages/AddTestResultPage.tsx` | 126–128 |
| INPUT-004 | High | `new Function` in certificate PDF component | `visits/components/TestCertificatePDF.tsx` | 414–417 |
| INPUT-005 | Medium | Mass assignment on test-results, equipment, customers, test-types | `test-result/test-result.schema.ts` | 3–10 |
| INPUT-006 | Medium | Test type schemas allow arbitrary config with executable formulas | `test-type/test-type.schema.ts` | 3–20 |
| INPUT-007 | Medium | No maximum password length — bcrypt DoS vector | `auth/auth.schema.ts` | 4–6 |

**INPUT-001:** `req.query` passed directly into MongoDB `$match`. Express extended parser allows operators like `status[$ne]`.

**INPUT-002:**
```ts
export const createVisitSchema = Joi.object({ ... }).unknown(true);
```
Arbitrary extra fields flow into Mongoose `create`/`update`.

**INPUT-003/004:** Formula strings from `computedFrom` config passed to `new Function()`. A compromised admin or DB tamper executes arbitrary JS in all visitors' browsers.
```ts
const fn = new Function(...paramNames, `return !!(${cf})`);
```

---

### API Security

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| API-001 | High | CORS allows all origins | `src/app.ts` | 18 |
| API-002 | High | No security headers (helmet) or CSP | `backend/package.json` | — |
| API-003 | High | No global rate limiting | `src/app.ts` | 1–40 |
| API-004 | Medium | `trust proxy` not configured | `src/server.ts` | 9–13 |
| API-005 | Low | No explicit JSON body size limit | `src/app.ts` | 19 |

**API-001:** `app.use(cors())` reflects any `Origin` header.  
**API-002:** `helmet` is not a dependency. No HSTS, X-Frame-Options, CSP, X-Content-Type-Options.  
**API-003:** No `express-rate-limit` mounted at the application level.

---

### Secrets & Environment

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| SEC-001 | **Critical** | Production MongoDB credentials in `.env.development` | `.env.development` | 9–10, 13–15 |
| SEC-002 | High | Frontend `.gitignore` does not ignore `.env.development`/`.env.production` | `setu_labs_frontend/.gitignore` | 12–17 |
| SEC-003 | Medium | JWT secrets not enforced for minimum entropy | `config/env.ts` | 17–20 |

**SEC-001:** File contains `mongodb+srv` URI with embedded username/password and JWT secrets. Rotate credentials immediately if ever committed or shared.

**SEC-002:** Only `.env` and `*.local` variants are gitignored. `.env.production` can accrue secrets.

---

### Data Exposure

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| DATA-001 | **Critical** | Plaintext passwords logged in error handler | `middlewares/error.middleware.ts` | 15–24 |
| DATA-002 | High | IDOR: any authenticated user can read all visits, customers, users | `visit/visit.route.ts` | 20–30 |
| DATA-003 | High | IDOR: test result lookup ignores visit/task path params | `test-result/test-result.controller.ts` | 15–18 |
| DATA-004 | Medium | GET /api/users returns full user list to any authenticated caller | `user/user.route.ts` | 18–19 |
| DATA-005 | Medium | PII (engineer emails, site addresses) in all visit aggregates | `visit/visit.service.ts` | 56–57 |

**DATA-001:**
```ts
logger.error(err.message, {
  ...(Object.keys(req.body || {}).length && { body: req.body }),
});
```
On login failure, plaintext password is written to logs.

---

### Frontend Security

| ID | Severity | Title | File | Lines |
|---|---|---|---|---|
| FE-001 | High | Public signup route always present in production UI | `src/app/App.tsx` | 125–126 |
| FE-002 | Medium | IDOR via direct URL navigation without RoleGuard | `src/app/App.tsx` | 229–243 |
| FE-003 | Medium | `webpack devServer allowedHosts: 'all'` | `webpack.config.js` | 84 |
| FE-004 | Medium | Any authenticated user can mutate visit tasks | `visit/visit.route.ts` | 42–67 |

---

### Dependencies

| ID | Severity | Title |
|---|---|---|
| DEP-001 | Medium | Missing `helmet`, `express-rate-limit` security packages |

Run `pnpm audit` in both packages for CVE-specific dependency entries.

---

## RBAC Coverage Gaps

| Endpoint | Auth | Role Guard | Risk |
|---|---|---|---|
| POST /api/auth/register | none | none | High |
| GET /api/users | Bearer | none | Medium |
| GET /api/customers, /api/visits, /api/equipment, /api/instruments | Bearer | none (any role) | High |
| POST/PATCH /api/visits/:id/tasks/* | Bearer | none | High |
| POST /api/test-results, recalculate | Bearer | none | Medium |
| GET /api/stats/dashboard | Bearer | super_admin, auditor | OK |

---

## Positive Controls

- bcrypt cost 12 for password hashes and refresh token hashes
- Refresh token rotation with server-side hash invalidation on logout
- Joi validation middleware strips unknown fields on validated routes (`validate()`)
- RBAC enforced on destructive admin operations (role changes, org settings)
- `passwordHash` and `refreshTokenHash` excluded from API JSON transforms
- No `dangerouslySetInnerHTML` usage found in frontend codebase

---

## Compliance Note

App targets 21 CFR Part 11 / ALCOA+. Open registration, broad read access, and password logging conflict with Part 11 audit trail and access control requirements.
