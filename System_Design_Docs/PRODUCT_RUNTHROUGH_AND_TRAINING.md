# Product Runthrough & Training Guide

**Product**: OTS Company Standard Node.js Template  
**Stack**: Node.js 20+ / Express 4.18 / TypeScript 5.3 / pnpm

---

## Part 1: Product Runthrough

### What This Is

A company-wide **starter template** for building backend services. Every new Node.js project starts from this template via a CLI scaffolding tool. It enforces coding standards, project structure, commit conventions, and CI/CD pipelines out of the box.

### How Teams Use It

```bash
pnpm create @ots-solutions-jg/node-express-app-std my-project
cd my-project
cp .env.example .env.development
pnpm dev
```

The `create-app/` directory contains the scaffolding CLI that copies `create-app/template/` into a new project directory.

---

### Architecture: Request Lifecycle

```
Client Request
    │
    ▼
┌─────────────────────┐
│  express.json()      │  Parse JSON body
│  express.urlencoded()│  Parse URL-encoded body
│  requestLogger       │  Log method, URL, status, duration
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Route Layer         │  /health, /api/users, etc.
│  validate()          │  Joi schema validation (body/params/query)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Controller          │  Handle req/res, delegate to service
│  (try/catch → next)  │  Pass errors to error middleware
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Service             │  Business logic, no HTTP awareness
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  errorHandler        │  Catches all errors, logs, returns JSON
└─────────────────────┘
```

---

### Module Structure (Feature-Based)

Each feature lives in `src/modules/<name>/` with four files:

| File | Role | Example |
|------|------|---------|
| `user.route.ts` | Define endpoints, wire middleware | `router.post('/', validate(schema), controller.createUser)` |
| `user.controller.ts` | Extract request data, call service, send response | `const user = await userService.createUser(req.body)` |
| `user.service.ts` | Pure business logic, no Express types | `users.push(user); return toSafeUser(user)` |
| `user.schema.ts` | Joi validation schemas | `Joi.object({ email: Joi.string().email().required() })` |

---

### Key Subsystems

#### 1. Configuration (`src/config/`)

**`env.ts`** — Loads `.env.${NODE_ENV}` via dotenv, validates with Joi, exports typed `env` object:

```typescript
export const env = {
  nodeEnv: NODE_ENV,       // 'development' | 'qa' | 'production' | 'test'
  port: Number(value.PORT),
  logLevel: value.LOG_LEVEL as string,
};
```

Fails fast on startup if required env vars are missing or invalid.

**`logger.ts`** — Winston logger with JSON format, timestamp, colorized console output. All logging goes through `logger.info()`, `logger.error()`, etc. `console.log` is banned.

#### 2. Validation Middleware (`src/middlewares/validate.middleware.ts`)

Accepts either a single Joi schema (auto-applied to `body`) or an explicit `{ body?, params?, query? }` map. Strips unknown fields. Returns 400 with all validation errors on failure.

#### 3. Error Handling

Two components work together:

- **`AppError`** — Custom error class with `statusCode`, `message`, `isOperational`. Thrown from controllers/services.
- **`errorHandler`** middleware — Catches all errors. Operational errors return their message; unexpected errors return generic "Internal server error". Logs full context (method, URL, body, params, stack).

#### 4. Graceful Shutdown (`src/server.ts`)

Handles SIGTERM, SIGINT, unhandledRejection, uncaughtException. Closes HTTP server, waits 10 seconds max, then force-exits.

---

### API Endpoints

| Method | Path | Validation | Description |
|--------|------|------------|-------------|
| GET | `/health` | None | Health check |
| POST | `/api/users` | body: email, password (min 8), name (min 2) | Create user |
| GET | `/api/users` | None | List all users |
| GET | `/api/users/:id` | params: id | Get user by ID |

---

### Quality Enforcement

| Layer | Tool | What It Does |
|-------|------|--------------|
| Pre-commit | Husky + lint-staged | ESLint + Prettier on staged `.ts` files |
| Commit message | commitlint | Enforces conventional commits (`feat:`, `fix:`, etc.) |
| CI | GitHub Actions | lint, format check, commitlint, build, test |
| Package manager | `preinstall` script | Blocks npm/yarn, enforces pnpm |

---

### Testing

Jest + ts-jest. Tests live in `tests/`. The user module test demonstrates the pattern:

- `beforeEach` → clear state with `UserService.clearUsers()`
- Test service methods directly
- Assert return shapes (no `passwordHash` leaks)

Run: `pnpm test`

---

## Part 2: Training Session Outline

### Session 1: Orientation (30 min)

**Goal**: Understand why this template exists and how to start a project.

1. **Problem statement**: Without a standard template, teams diverge on structure, logging, error handling, commit formats. This template eliminates that.

2. **Live demo**: Scaffold a new project

   ```bash
   pnpm create @ots-solutions-jg/node-express-app-std demo-app
   cd demo-app
   cp .env.example .env.development
   pnpm dev
   # Hit http://localhost:3000/health
   # POST http://localhost:3000/api/users with { "email": "a@b.com", "password": "12345678", "name": "Test" }
   # GET http://localhost:3000/api/users
   ```

3. **Walk through folder structure**: Open the project, show `src/` layout, explain the module pattern.

---

### Session 2: Building a Module (45 min)

**Goal**: Add a new feature module end-to-end.

**Exercise**: Build a `product` module.

| Step | File | Action |
|------|------|--------|
| 1 | `src/modules/product/product.schema.ts` | Define Joi schemas for create/get |
| 2 | `src/modules/product/product.service.ts` | Write business logic (in-memory array) |
| 3 | `src/modules/product/product.controller.ts` | Wire service calls, handle errors |
| 4 | `src/modules/product/product.route.ts` | Define routes, attach validation |
| 5 | `src/app.ts` | Register `app.use('/api/products', productRoutes)` |
| 6 | `tests/product.test.ts` | Write unit tests for the service |

Key teaching points during this exercise:

- Schema goes first — define the contract before writing logic
- Service has zero Express imports — pure business logic
- Controller is thin — extract, delegate, respond
- Validation middleware handles all input checking before controller runs
- Errors flow through `next()` to the centralized error handler

---

### Session 3: Standards & Guardrails (30 min)

**Goal**: Understand what the template enforces and why.

1. **Conventional commits**: Demo a bad commit being rejected

   ```bash
   git commit -m "added stuff"  # Rejected by commitlint
   git commit -m "feat: add product module"  # Accepted
   ```

2. **Lint-staged**: Introduce a lint error, try to commit, watch it fail

3. **Logger discipline**: Show `logger.info()` vs `console.log()` — ESLint rule catches console usage

4. **Environment validation**: Remove `PORT` from `.env.development`, start server, observe Joi validation crash on startup — fail-fast behavior

5. **Error handling**: Throw `new AppError(400, 'Bad input')` vs `throw new Error('crash')` — show difference in API response (operational message vs generic "Internal server error")

---

### Session 4: CI/CD Pipeline (20 min)

**Goal**: Understand what happens on push/PR.

Walk through `.github/workflows/ci.yml`:

| Job | Steps | Fails When |
|-----|-------|------------|
| `lint` | ESLint, Prettier check, commitlint (PRs only) | Code style violations, bad commit messages |
| `build` | `pnpm run build` (tsc) | TypeScript errors |
| `test` | `pnpm test` (Jest) | Failing tests |

All three jobs run in parallel. PR cannot merge if any fail.

---

### Session 5: Extending the Template (20 min)

**Goal**: Know where to add things when project requirements grow beyond the template.

| Need | Where to Add |
|------|-------------|
| Database (Prisma/TypeORM) | `src/config/database.ts`, model files in modules |
| Authentication | `src/middlewares/auth.middleware.ts`, JWT/session config in `src/config/` |
| New env vars | Add to `.env.example`, add Joi validation in `src/config/env.ts` |
| API versioning | Prefix routes: `app.use('/api/v1/users', userRoutes)` |
| Rate limiting | `express-rate-limit` middleware in `src/middlewares/` |
| File uploads | `multer` middleware, dedicated upload module |
| WebSockets | `socket.io` setup in `src/server.ts` alongside HTTP |

---

### Quick Reference Card (Handout)

```
SCAFFOLD:  pnpm create @ots-solutions-jg/node-express-app-std <name>
DEV:       pnpm dev
BUILD:     pnpm build && pnpm start
TEST:      pnpm test
LINT:      pnpm lint:fix
FORMAT:    pnpm format

MODULE FILES:   route → controller → service → schema
LOGGING:        import { logger } from '../../config/logger'
ERRORS:         throw new AppError(statusCode, message)
VALIDATION:     validate(joiSchema) middleware on route
ENV VARS:       Add to .env.example + validate in src/config/env.ts
COMMITS:        type: description  (feat|fix|docs|refactor|test|chore)
```

---

### Recommended Demo Flow for Live Presentation

1. Open terminal, scaffold project — 2 min
2. Start server, hit `/health` — 1 min
3. Create a user via POST, retrieve via GET — 3 min
4. Show validation failure (missing email) — 2 min
5. Show error handling (GET nonexistent user ID) — 2 min
6. Open `src/modules/user/` and walk through the four files — 5 min
7. Live-code a `product` module from scratch — 15 min
8. Run tests — 2 min
9. Demo bad commit rejection — 2 min
10. Show CI workflow — 3 min

**Total**: ~35 min live demo + Q&A
