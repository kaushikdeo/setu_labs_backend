# CRM Pipeline Health — Implementation Reference

## Model

**Derived health** (`healthStatus`, `healthReasons`) — computed on list/detail via `crm-health/compute-health.ts`. Never persisted.

**Manual `on_hold`** — persisted status on lead, prospect, opportunity with `holdReason`, `holdUntil`, `holdNotes`, `heldAt`, `heldBy`, `previousStatus`, `previousStage`.

On-hold records are excluded from stale KPIs and follow-up overdue queues.

## Hold reasons

`customer_requested` | `budget_frozen` | `project_deferred` | `awaiting_tender` | `no_response` | `other`

## Thresholds

| Entity | Stale (inactive) |
|--------|------------------|
| Lead | 14 days |
| Prospect | 14 days |
| Opportunity | 7 days |

At-risk: prospect `daysInStage >= 14`; opportunity quote-sent no response >= 14d (future: quote `sentAt`).

## API

| Action | Endpoint |
|--------|----------|
| Put on hold | `POST /api/{leads\|prospects\|opportunities}/:id/on-hold` |
| Resume | `POST /api/{entity}/:id/resume` |
| Snooze alerts | `POST /api/{entity}/:id/snooze` `{ days: 1-90 }` |

List scopes: `on_hold`, `at_risk`, `needs_attention` (plus existing `stale`).

Stats extended: `onHoldCount`, `atRiskCount`, `criticalCount`, `onHoldValue`, `onHoldExpiringSoon`.

## Frontend

- Pages: `/leads/on-hold`, `/prospects/on-hold`, `/prospects/at-risk`, `/opportunities/on-hold`
- Shared UI: `shared/crm/PutOnHoldModal`, `ResumeModal`, `HealthBadge`, `PipelineHealthActions`
- Notifications read API: `GET /api/notifications`, `PATCH /api/notifications/:id/read`

## Cron

See [CRON_SERVICE_PLAN.md](./CRON_SERVICE_PLAN.md). Cron emits notifications only — never auto-sets `on_hold`.
