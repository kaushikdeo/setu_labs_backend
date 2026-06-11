# Multi-Tenancy

## Overview

SetuLab is moving from single-tenant (one global organization) to multi-organization tenancy. Each organization is an isolated tenant; users and business data are scoped by `organizationId`.

Wave 1 added optional `organizationId` fields and a migration script. Wave 2 backfilled data. Wave 3 enables scoped APIs and required `organizationId` on users.

## Runtime (Wave 3)

- JWT access token includes `organizationId`
- `authenticate` middleware sets `req.user.organizationId` (loads from DB if missing in legacy tokens)
- All tenant APIs filter by `req.user.organizationId`
- `POST /api/organization` removed — org stub created at register / `create-super-admin`; onboarding uses `PATCH /api/organization`
- Self-registration (when enabled) creates stub org + `super_admin` user
- Admin `createUser` inherits creator's `organizationId`
- Cron jobs loop `getAllActiveOrgConfigs()`
- Test type `code` is unique per org (`{ organizationId, code }`); on create an 8-char hex suffix is appended (e.g. `AIR_VELOCITY_TEST_a1b2c3d4`)

### Index migration (test types)

After deploy, run once per environment:

```bash
pnpm script:migrate-test-type-index --confirm
```

Drops legacy global `code_1` index on `testtypes` that blocked duplicate codes across orgs.

---

## Schema (Wave 1)

`organizationId` is optional on:

- `User`
- All domain collections (customers, leads, visits, CRM, etc.)
- `AuditLog`, `Notification`, `SrCounter`

Helper: [`src/utils/tenant.ts`](../src/utils/tenant.ts) — `orgFilter()`, `assertSameOrg()` (used in Wave 3).

---

## Migration Script

### When to run

After deploying Wave 1 schema changes, **before** deploying Wave 3 (required `organizationId` + scoped queries).

### Commands

```bash
# Dry run — report only
pnpm script:migrate-multi-tenant

# With staff overrides
pnpm script:migrate-multi-tenant --user-org-map ./migration-user-org.json

# Execute (backup first)
pnpm script:migrate-multi-tenant --confirm

# Verify after migration
pnpm script:verify-multi-tenant

# Full example
pnpm script:migrate-multi-tenant --user-org-map ./migration-user-org.json --primary-org-id <orgId> --confirm
```

### Backup before --confirm

```bash
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB" --out="./backups/pre-migrate-$(date +%Y%m%d-%H%M%S)"
```

### Troubleshooting

Stale `src/modules/**/*.model.js` files shadow `.ts` schemas at runtime. If migration reports `modifiedCount` but verification still shows missing `organizationId`, delete those `.js` files and re-run `--confirm`.

### Strategy: split by super_admin

| Entity | Assignment rule |
|--------|-----------------|
| super_admin | Own org; keeps existing org if `Organization.createdBy` matches |
| super_admin without org | Stub org created |
| Staff users | Primary legacy org (or `--user-org-map`) |
| Customer users | Org of linked `customerId` (after customers backfilled) |
| Domain data | Org of `createdBy` user; fallback → primary org |
| test-types | Primary org (no `createdBy`) |
| audit-logs | Org of `userId` |
| notifications | Org of `recipientUserId` |
| sr-counters | Primary org |

### Staff override map

`migration-user-org.json`:

```json
{
  "engineer@acme.com": "507f1f77bcf86cd799439011",
  "qa@acme.com": "507f1f77bcf86cd799439011"
}
```

Keys are user emails; values are organization ObjectId strings.

---

## Deploy order

1. Deploy Wave 1 (optional `organizationId` on models)
2. MongoDB backup
3. Run `pnpm script:migrate-multi-tenant --confirm`
4. Verify zero missing `organizationId` in script output
5. Deploy Wave 3 (auth JWT, scoped services, required fields)
6. All users re-login

---

## Pre-migration checklist

- [ ] MongoDB backup/snapshot
- [ ] Export users and roles
- [ ] Prepare `migration-user-org.json` if multiple super_admins exist
- [ ] Dry-run on staging and review super_admin → org mapping
- [ ] Run `--confirm` on staging
- [ ] Run `pnpm script:verify-multi-tenant` (all collections 0 missing)
- [ ] Run `--confirm` on production
- [ ] Re-login all users after Wave 3 deploy

## Wave 2 result (dev — project_setu_labs)

- Backup: `setulab_backend/backups/pre-migrate-20260611-185434/`
- Organizations: 2 (Scifi Sebex + Vikas Jaiswar stub org)
- All collections verified 0 missing `organizationId`
