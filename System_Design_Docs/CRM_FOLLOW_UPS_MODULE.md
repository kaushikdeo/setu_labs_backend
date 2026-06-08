# CRM Follow-ups Module

Unified follow-up management for leads, prospects, and opportunities.

## Storage model

Dual storage (same as prospects plan):

1. **Denormalized fields** on the entity:
   - Lead: `followUpDate`, `followUpMode`
   - Prospect / Opportunity: `nextFollowUpDate`, `nextFollowUpMode`
2. **Activity records** (`type: follow_up`) via polymorphic `entityType` + `entityId`

Scheduled follow-ups are future-dated activities. Completion stamps `metadata.completedAt`, `metadata.completedAs`, `metadata.completedBy` on the activity and logs a touchpoint with optional `metadata.completesFollowUpId`.

## Backend

Module: `setulab_backend/src/modules/follow-up/`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/follow-ups?entityType=all\|lead\|prospect\|opportunity&scope=mine\|all` | `{ overdue, dueToday, upcoming }` |
| GET | `/api/follow-ups/completed?entityType=&days=30&scope=` | Completed follow-ups joined with entity |
| POST | `/api/follow-ups/:entityType/:id/complete` | Mark done + touchpoint + optional reschedule |
| DELETE | `/api/follow-ups/:entityType/:id` | Clear denormalized fields (history preserved) |

Entity-specific routes (backward compatible):

- `POST/DELETE /api/leads/:id/follow-up/...`
- `POST/DELETE /api/prospects/:id/follow-up/...`
- `POST/DELETE /api/opportunities/:id/follow-up/...`

Scheduling: `POST /api/activities` with `type: follow_up`. The activity controller calls `followUpService.syncFromActivity` for all entity types.

Lead conversion copies `followUpDate`/`followUpMode` → prospect `nextFollowUpDate`/`nextFollowUpMode`.

## Frontend

Module: `setulab_frontend/src/features/follow-ups/`

Shared components:

- `NextActionCard` — schedule / reschedule / clear on detail pages
- `FollowUpsTable` — overdue, due today, upcoming, completed
- `FollowUpsPageShell` — page layout with optional sub-nav

Routes:

| Route | Scope |
|-------|-------|
| `/follow-ups` | All entities (tabs) |
| `/follow-ups/leads` | Leads only |
| `/follow-ups/prospects` | Prospects only |
| `/follow-ups/opportunities` | Opportunities only |
| `/leads/follow-ups` | Leads module sub-page |
| `/prospects/follow-ups` | Prospects module sub-page |
| `/opportunities/follow-ups` | Opportunities module sub-page |

Follow-ups are **stage-agnostic** — available on any open lead, prospect, or opportunity via `NextActionCard` and activity timeline "Schedule follow-up" type.

## Hooks

`useScheduleFollowUp(entityType, id)`, `useCompleteFollowUp`, `useClearFollowUp`, `useFollowUps(entityType)`, `useCompletedFollowUps(entityType)` in `features/follow-ups/hooks/useFollowUpQueries.ts`.

Prospect and opportunity feature hooks delegate to these shared hooks.
