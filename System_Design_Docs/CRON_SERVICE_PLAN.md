# Cron Service — `Cron_service/`

Standalone Node process (sibling to `setulab_backend`). Shares MongoDB. Reuses backend Mongoose models via relative imports.

## Run locally

```bash
cd Cron_service
cp .env.example .env.development
# Set MONGODB_URI and MONGODB_DB to match setulab_backend/.env.development
pnpm install
pnpm dev
```

In a second terminal, run the API: `cd setulab_backend && pnpm dev`.

Run a single job immediately:

```bash
pnpm job:run -- staleLeadAlerts
pnpm job:run -- followUpReminders
```

## Structure

| Path | Role |
|------|------|
| `src/index.ts` | Entry, DB connect, scheduler, graceful shutdown |
| `src/run-job-cli.ts` | Manual job trigger |
| `src/scheduler/job-registry.ts` | Cron registration (`Asia/Kolkata` default) |
| `src/scheduler/run-job.ts` | Audit to `cron_job_runs` |
| `src/modules/org/org-config.ts` | Org notification settings gate |
| `src/modules/email/email-provider.ts` | Console email (SMTP stub) |
| `src/modules/notification/notification.service.ts` | Deduped in-app + optional email |
| `src/jobs/crm/pipeline-health.ts` | Stale + hold resurface + close-date alerts |
| `src/jobs/crm/follow-up-reminders.ts` | Due today, overdue, upcoming follow-ups |
| `src/jobs/crm/due-activity-follow-ups.ts` | System activity tasks past `occurredAt` |
| `src/jobs/crm/deadline-reminders.ts` | Submission deadline, quote validity, review escalation |
| `src/jobs/crm/daily-summary.ts` | Weekday digest when org flag enabled |

## Phase 1 schedule

| Job | Cron |
|-----|------|
| `dailySummaryEmail` | `0 7 * * 1-5` |
| `staleLeadAlerts` | `0 8 * * *` |
| `staleProspectAlerts` | `0 8 * * *` |
| `staleOpportunityAlerts` | `0 8 * * *` |
| `holdUntilResurface` | `0 9 * * *` |
| `closeDateMissedAlerts` | `0 9 * * *` |
| `submissionDeadlineReminders` | `0 9 * * *` |
| `quoteValidityAlerts` | `0 9 * * *` |
| `followUpReminders` | `*/15 * * * *` |
| `dueActivityFollowUps` | `*/15 * * * *` |
| `reviewEscalation` | `0 * * * *` |

## Notifications

Collection: `notifications`. `dedupeKey` unique index prevents duplicate sends per day/tier.

Cron writes; backend `GET /api/notifications` and `PATCH /api/notifications/:id/read` read/update.

**Org gating:** All jobs skip when `Organization.isReminderEngineEnabled === false`.

**Stale rules:** Notification-only — no status mutation. Skips `on_hold`, `converted`, `not_interested`, and `alertSnoozedUntil > now`. Manager escalation at 2× `escalationDays`.

## Env vars

| Var | Required | Notes |
|-----|----------|-------|
| `MONGODB_URI` | yes | Same as backend |
| `MONGODB_DB` | yes | Same as backend |
| `LOG_LEVEL` | no | Default `info` |
| `CRON_TZ` | no | Default `Asia/Kolkata` |
| `NODE_ENV` | yes | `development` for local |

## Phase 2 (deferred)

Field service jobs: instrument calibration expiry, equipment validation due, visit reminders, report approval escalation.

Production deployment (Docker/ECS) deferred until after local validation.
