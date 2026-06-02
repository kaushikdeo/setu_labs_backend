# Customer Portal — Design Document

## Overview

The customer portal allows external customer users to log in, review validation reports submitted by the lab, approve or reject them with comments, and download approved report PDFs.

---

## User Flow

```
Admin creates User (role: customer, linked to customerId)
        ↓
Customer logs in → redirected to /portal
        ↓
Portal Dashboard → stat summary (pending / approved / rejected)
        ↓
Reports List → filtered to customer's own reports
        ↓
Report Detail → view test results per equipment task
        ↓
Approve (with optional comment) OR Reject (comment required)
        ↓
If Approved → Download PDF certificate
If Rejected → Staff revises and resubmits → cycle repeats
```

---

## Data Model

### `Report` (MongoDB Collection: `reports`)

| Field | Type | Description |
|-------|------|-------------|
| `visitId` | ObjectId (ref: Visit) | One report per visit (unique) |
| `customerId` | ObjectId (ref: Customer) | Denormalized for fast filtering |
| `title` | String | Auto-generated: `"Report - {srNumber}"` |
| `status` | Enum | `draft` → `pending_approval` → `approved` / `rejected` |
| `submittedForApprovalAt` | Date | When staff submitted for customer review |
| `submittedBy` | String (userId) | Staff user who submitted |
| `approvedAt` | Date | Approval timestamp |
| `approvedBy` | String (userId) | Customer user who approved |
| `approvalHistory` | Array | Full audit trail of actions |

### `approvalHistory` entry

```typescript
{
  action: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  comment?: string;
  performedBy: string;  // userId
  performedAt: Date;
}
```

### `User` model update

`customerId?: ObjectId` added — only populated when `role === 'customer'`. Stored in the JWT payload so all authenticated requests carry it without extra DB lookups.

---

## Backend API

### Routes (`/api/reports`, all require `authenticate`)

| Method | Path | Role | Action |
|--------|------|------|--------|
| `POST` | `/` | `super_admin`, `validation_head` | Create report from `visitId` (visit must be `completed`) |
| `GET` | `/` | all | Staff: all reports; customer: filtered to their `customerId` |
| `GET` | `/:id` | all | Report detail with populated tasks + test results |
| `GET` | `/by-visit/:visitId` | all | Look up existing report for a visit |
| `POST` | `/:id/submit` | `super_admin`, `validation_head` | Transition `draft`/`rejected` → `pending_approval` |
| `POST` | `/:id/approve` | `customer` | Transition `pending_approval` → `approved` |
| `POST` | `/:id/reject` | `customer` | Transition `pending_approval` → `rejected` (comment required) |

### Customer scoping

When `req.user.role === 'customer'`, `ReportService.getAllReports()` and `getReportById()` automatically restrict results to the `customerId` from the JWT — no extra middleware required.

---

## Frontend Routes

### Customer Portal (`/portal/*`)

Guarded by `PortalRoute` — requires authenticated user with `role === 'customer'`. Renders inside `PortalLayout` (minimal header, no staff navigation).

| Route | Component | Description |
|-------|-----------|-------------|
| `/portal` | `PortalDashboardPage` | Stat cards + recent reports |
| `/portal/reports` | `PortalReportsPage` | Filterable reports table |
| `/portal/reports/:id` | `PortalReportDetailPage` | Detail view + approve/reject form |

### Staff Reports (`/reports/*`)

Inside the existing `ProtectedRoute` + `MainLayout`. Sidebar "Reports" link is now active.

| Route | Component | Description |
|-------|-----------|-------------|
| `/reports` | `ReportsPage` | All reports with status filter + inline submit action |
| `/reports/:id` | `ReportDetailPage` | Detail view + submit/resubmit for approval |

### Visit Detail integration

When a visit is `completed` and `canManage` (super_admin / validation_head):
- If no report exists → "Create Report" button → creates report and navigates to `/reports/:id`
- If report exists → "View Report" link → navigates to `/reports/:id`

---

## Auth Redirect Logic

| Role | After login redirects to |
|------|--------------------------|
| `customer` | `/portal` |
| `super_admin` (first time) | `/onboarding` |
| all others | `/` |

`ProtectedRoute` (for `/` and all staff routes) redirects `customer` role to `/portal`.
`PortalRoute` (for `/portal/*`) redirects non-customer roles to `/`.

---

## Key Files

### Backend
```
src/modules/report/report.model.ts
src/modules/report/report.service.ts
src/modules/report/report.controller.ts
src/modules/report/report.route.ts
src/modules/report/report.schema.ts
src/modules/user/user.model.ts          (added customerId field)
src/modules/user/user.service.ts        (CreateUserDto: added customerId)
src/modules/auth/auth.service.ts        (customerId in JWT payload)
src/middlewares/auth.middleware.ts      (decode customerId from JWT)
src/types/express.d.ts                  (req.user.customerId)
src/modules/audit/audit.model.ts        (added report.* audit actions)
src/app.ts                              (mounted /api/reports)
```

### Frontend
```
src/features/customer-portal/pages/PortalDashboardPage.tsx
src/features/customer-portal/pages/PortalReportsPage.tsx
src/features/customer-portal/pages/PortalReportDetailPage.tsx
src/features/reports/pages/ReportsPage.tsx
src/features/reports/pages/ReportDetailPage.tsx
src/features/reports/api/reportsApi.ts
src/features/reports/hooks/useReportQueries.ts
src/features/reports/types/report.types.ts
src/shared/components/PortalLayout.tsx
src/shared/components/PortalRoute.tsx
src/app/App.tsx                         (portal + report routes)
src/shared/components/ProtectedRoute.tsx (customer redirect to /portal)
src/features/auth/hooks/useAuthQueries.ts (login redirect for customer)
src/features/users/pages/AddUserPage.tsx  (customer selector)
src/features/visits/pages/VisitDetailPage.tsx (Create Report button)
```

---

## Security Notes

- Customer users can only see and act on reports belonging to their linked `customerId`.
- The `customerId` is embedded in the JWT access token at login — no per-request DB lookup needed.
- `approve` and `reject` actions additionally verify the report's `customerId` matches `req.user.customerId` at the service layer (defence in depth).
- PDF download for approved reports is client-side using `@react-pdf/renderer` — no server-side file storage required.
