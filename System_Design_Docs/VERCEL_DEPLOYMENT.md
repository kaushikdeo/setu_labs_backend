# Vercel Deployment Guide

## Architecture

This Express/TypeScript backend is deployed to Vercel as a **serverless function**.

- `api/index.ts` — Vercel entry point; wraps the Express `app` as a serverless handler
- `vercel.json` — routes all `/*` requests to `api/index.ts`
- DB connection uses a module-level singleton (`isConnected` flag) to avoid reconnecting on every warm invocation

## Code Changes Made for Vercel Compatibility

| File | Change |
|---|---|
| `src/config/env.ts` | `PORT` changed from `required()` to `default(3001)` — Vercel serverless has no PORT |
| `package.json` | `prepare` script guarded against `CI` / `VERCEL` env vars so husky doesn't run on Vercel build |
| `tsconfig.json` | `api/**/*` added to `include` array |
| `api/index.ts` | New — Vercel serverless handler |
| `vercel.json` | New — Vercel build + routing config |

## Step-by-Step Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Set Environment Variables in Vercel Dashboard

Go to **vercel.com → Project → Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `MONGODB_DB` | `project_setu_labs` |
| `JWT_SECRET` | `<your secret>` |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_SECRET` | `<your secret>` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |

Set environment to **Production** (and optionally Preview).

> Do NOT commit `.env.*` files. Vercel injects these directly into `process.env` at runtime.

### 4. Deploy from CLI

From the `setu_labs_backend` directory:

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Set root directory to `.` (the backend folder)
- Vercel auto-detects Node.js

For production deployment:

```bash
vercel --prod
```

### 5. Verify

Hit the deployed URL:

```
GET https://<your-deployment>.vercel.app/health
```

Expected response:

```json
{ "success": true, "message": "Server is healthy" }
```

## GitHub Integration (Recommended for CI/CD)

1. Push `setu_labs_backend` to a GitHub repo
2. In Vercel dashboard → **New Project** → import the repo
3. Set **Root Directory** to `setu_labs_backend` (if monorepo)
4. Add env vars as above
5. Vercel auto-deploys on every push to `main`

## Caveats

- **Serverless cold starts**: First request after inactivity reconnects to MongoDB (~200–500ms overhead)
- **No persistent state**: In-memory data, cron jobs, or WebSockets won't work on Vercel serverless
- **Function timeout**: Vercel Hobby plan limits functions to 10s; Pro plan allows 60s. Long-running operations (file processing, etc.) may need a dedicated server instead
- **`pnpm` on Vercel**: Vercel supports pnpm natively. Ensure `packageManager` field is set in `package.json` or Vercel detects `pnpm-lock.yaml` automatically
