# @ots-solutions-jg/create-node-express-app-std — Usage Guide

npm package: [@ots-solutions-jg/create-node-express-app-std](https://www.npmjs.com/package/@ots-solutions-jg/create-node-express-app-std)

---

## What This Package Does

This is a scaffolding CLI that creates a new Node.js + Express + TypeScript project from the OTS Solutions company standard template. It sets up the full project structure, installs dependencies, and initializes a git repository — ready to develop in under a minute.

---

## Prerequisites

| Requirement | Minimum Version | Install |
|-------------|-----------------|---------|
| Node.js | 20+ (LTS) | [nodejs.org](https://nodejs.org) |
| pnpm | 8+ | `npm install -g pnpm` |
| git | any | [git-scm.com](https://git-scm.com) |

---

## Creating a New Project

### Step 1: Scaffold

```bash
pnpm create @ots-solutions-jg/node-express-app-std my-project
```

Replace `my-project` with your desired project name. This will:

1. Create the `my-project/` directory
2. Copy all template files into it
3. Set `package.json` name to `my-project` and version to `0.1.0`
4. Run `git init`
5. Run `pnpm install`

### Step 2: Configure Environment

```bash
cd my-project
cp .env.example .env.development
```

Edit `.env.development` with your values:

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

| Variable | Required | Values | Default |
|----------|----------|--------|---------|
| `PORT` | Yes | Any valid port number | `3000` |
| `NODE_ENV` | Yes | `development`, `qa`, `production`, `test` | `development` |
| `LOG_LEVEL` | Yes | `debug`, `info`, `warn`, `error` | `info` |

### Step 3: Start the Dev Server

```bash
pnpm dev
```

Output:

```
2026-03-05 09:00:00 [info]: Server running on port 3000 in development mode
```

### Step 4: Verify

```bash
curl http://localhost:3000/health
```

Response:

```json
{ "success": true, "message": "Server is healthy" }
```

---

## What You Get

### Project Structure

```
my-project/
├── src/
│   ├── app.ts                          # Express app setup, middleware registration
│   ├── server.ts                       # Entry point, graceful shutdown handling
│   ├── config/
│   │   ├── env.ts                      # Joi-validated environment variables
│   │   └── logger.ts                   # Winston logger (structured, colorized)
│   ├── modules/
│   │   └── user/                       # Example module (replace/extend with your own)
│   │       ├── user.route.ts           # Route definitions
│   │       ├── user.controller.ts      # Request/response handling
│   │       ├── user.service.ts         # Business logic
│   │       └── user.schema.ts          # Joi validation schemas
│   ├── middlewares/
│   │   ├── validate.middleware.ts      # Body/params/query validation
│   │   ├── error.middleware.ts         # Centralized error handler
│   │   └── request-logger.middleware.ts # HTTP request logging
│   ├── utils/
│   │   └── app-error.ts               # Custom AppError class
│   └── types/
│       └── express.d.ts               # Express type extensions
├── tests/
│   └── user.test.ts                    # Example unit tests
├── .husky/                             # Git hooks (pre-commit, commit-msg)
├── .github/workflows/ci.yml           # GitHub Actions CI pipeline
├── .env.example                        # Environment variable template
├── tsconfig.json                       # TypeScript configuration
├── .eslintrc.json                      # ESLint rules
├── .prettierrc                         # Prettier formatting rules
├── jest.config.js                      # Jest test configuration
└── package.json
```

### Available Scripts

| Command | What It Does |
|---------|-------------|
| `pnpm dev` | Start dev server with hot-reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm lint` | Run ESLint on all `.ts` files |
| `pnpm lint:fix` | Auto-fix ESLint violations |
| `pnpm format` | Format all files with Prettier |
| `pnpm test` | Run Jest test suite |

### Built-in API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/users` | Create a user (validated) |
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/:id` | Get user by ID (validated) |

---

## Adding a New Module

Every feature is organized as a module under `src/modules/`. Follow this pattern:

### 1. Create the module directory

```
src/modules/product/
├── product.route.ts
├── product.controller.ts
├── product.service.ts
└── product.schema.ts
```

### 2. Define the validation schema (`product.schema.ts`)

```typescript
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().positive().required(),
});
```

### 3. Create the service (`product.service.ts`)

```typescript
import { logger } from '../../config/logger';

export class ProductService {
  async create(data: { name: string; price: number }) {
    logger.debug('Creating product', { name: data.name });
    // your business logic here
  }
}
```

### 4. Create the controller (`product.controller.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';

const productService = new ProductService();

export class ProductController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  };
}
```

### 5. Define routes (`product.route.ts`)

```typescript
import { Router } from 'express';
import { ProductController } from './product.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema } from './product.schema';

const router = Router();
const productController = new ProductController();

router.post('/', validate(createProductSchema), productController.create);

export default router;
```

### 6. Register in `app.ts`

```typescript
import productRoutes from './modules/product/product.route';

app.use('/api/products', productRoutes);
```

---

## Logging

All logging goes through Winston. `console.log` is banned by ESLint.

```typescript
import { logger } from './config/logger';

logger.debug('Detailed trace info', { userId: '123' });
logger.info('Operation completed');
logger.warn('Something unexpected');
logger.error('Operation failed', { stack: error.stack });
```

Log output format:

```
2026-03-05 09:15:30 [info]: POST /api/users 201 - 12ms
```

---

## Error Handling

Throw `AppError` for operational errors with specific HTTP status codes:

```typescript
import { AppError } from '../utils/app-error';

if (!record) {
  throw new AppError(404, 'Record not found');
}
```

Unhandled errors are caught by the centralized error middleware and logged with stack traces.

---

## Validation

The `validate` middleware accepts Joi schemas for `body`, `params`, and `query`:

```typescript
// Body only (shorthand)
router.post('/', validate(createSchema), handler);

// Params validation
router.get('/:id', validate({ params: idSchema }), handler);

// Multiple sources
router.get('/', validate({ query: filterSchema, params: idSchema }), handler);
```

---

## Git Hooks

Husky enforces quality on every commit:

| Hook | What It Does |
|------|-------------|
| `pre-commit` | Runs ESLint + Prettier on staged `.ts` files via lint-staged |
| `commit-msg` | Validates commit message follows Conventional Commits |

Valid commit format:

```
feat: add product module
fix: resolve price calculation bug
docs: update API documentation
refactor: extract validation logic
test: add product service tests
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

---

## Deploying to Production

```bash
# 1. Create production env file
cp .env.example .env.production
# Edit .env.production: NODE_ENV=production, LOG_LEVEL=warn

# 2. Build
pnpm build

# 3. Run
pnpm start
```

The server handles `SIGTERM` and `SIGINT` with graceful shutdown — drains active connections before exiting.

---

## CI/CD

The included GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main`/`develop`:

1. ESLint check
2. Prettier format check
3. Commit message validation (on PRs)
4. TypeScript build
5. Jest tests

---

## Updating the Template

When the template is updated and a new version is published, new projects scaffolded with `pnpm create` will automatically use the latest version. Existing projects are not affected.

To force the latest version when scaffolding:

```bash
pnpm create @ots-solutions-jg/node-express-app-std@latest my-project
```
