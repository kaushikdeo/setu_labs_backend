# Node.js + Express + TypeScript Template

Official company standard template for building backend services with Node.js, Express, and TypeScript.

## Features

- ✅ **TypeScript** for type safety
- ✅ **Express** web framework
- ✅ **Winston** for structured logging
- ✅ **Joi** for request validation
- ✅ **ESLint + Prettier** for code quality
- ✅ **Husky + lint-staged** for git hooks
- ✅ **Commitlint** for conventional commits
- ✅ **Jest** for testing
- ✅ **Environment-based configuration** (dev, qa, prod)
- ✅ **CI/CD ready** with GitHub Actions

## Project Structure

```
node-express-ts-template/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server entry point
│   ├── config/
│   │   ├── env.ts               # Environment configuration
│   │   └── logger.ts            # Winston logger setup
│   ├── modules/
│   │   └── user/                # Example module
│   │       ├── user.route.ts
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── user.schema.ts
│   ├── middlewares/
│   │   ├── validate.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── request-logger.middleware.ts
│   ├── utils/
│   └── types/
├── tests/
├── .husky/
└── ...
```



## Check if pnpm is installed gobally

```bash
pnpm --version
```



## if pnpm is installed you will see 

```bash
10.30.3
```



## if pnpm is not installed run :

```bash
npm install -g pnpm
```



## Quick Start (New Project)

```bash
pnpm create @ots-solutions-jg/node-express-app-std my-project
cd my-project
cp .env.example .env.development
pnpm dev
```

## Getting Started (Existing Clone)

### Prerequisites

- Node.js 20+ (LTS)
- pnpm (`npm install -g pnpm`)

### Setup & Run

1. Install dependencies:

```bash
pnpm install
```

1. Create your environment file from the template:

```bash
cp .env.example .env.development
```

1. Edit `.env.development` and set your values (`PORT`, `LOG_LEVEL`, `NODE_ENV`).
2. Start the dev server:

```bash
pnpm dev
```

1. Verify it's running:

```bash
curl http://localhost:3000/health
```

Expected response: `{ "success": true, "message": "Server is healthy" }`

### Production Build

```bash
pnpm build
pnpm start
```

## Scripts


| Script       | Command         | Description                                      |
| ------------ | --------------- | ------------------------------------------------ |
| `dev`        | `pnpm dev`      | Start dev server with hot-reload (`ts-node-dev`) |
| `build`      | `pnpm build`    | Compile TypeScript to `dist/`                    |
| `start`      | `pnpm start`    | Run compiled production build                    |
| `lint`       | `pnpm lint`     | Run ESLint on all `.ts` files                    |
| `lint:fix`   | `pnpm lint:fix` | Auto-fix ESLint violations                       |
| `format`     | `pnpm format`   | Format all files with Prettier                   |
| `test`       | `pnpm test`     | Run Jest test suite                              |
| `prepare`    | (auto)          | Install Husky git hooks on `pnpm install`        |
| `preinstall` | (auto)          | Block `npm`/`yarn` — enforces pnpm only          |


## Environment Variables


| Variable  | Description      | Example     |
| --------- | ---------------- | ----------- |
| NODE_ENV  | Environment mode | development |
| PORT      | Server port      | 3000        |
| LOG_LEVEL | Logging level    | debug       |


## API Endpoints

### Health Check

```
GET /health
```

### User Module

```
POST   /api/users       - Create user
GET    /api/users       - Get all users
GET    /api/users/:id   - Get user by ID
```

## Module Structure

Each module follows a layered architecture:

1. **Route** - HTTP endpoint definitions
2. **Controller** - Request/response handling
3. **Service** - Business logic
4. **Schema** - Request validation

## Standards

- ❌ No `console.log` - use Winston logger
- ✅ All API requests must be validated with Joi
- ✅ Centralized error handling
- ✅ TypeScript strict mode
- ✅ Follow folder structure conventions
- ✅ Conventional commit messages required

## Git Hooks

This project uses **Husky** to enforce code quality and commit standards:

### Pre-commit Hook

- Runs ESLint on staged `.ts` files
- Formats code with Prettier
- Blocks commits if linting fails

### Commit Message Validation

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Valid examples
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login timeout"
git commit -m "docs: update API documentation"

# Invalid - will be rejected
git commit -m "Added new feature"  # ❌ Missing type
git commit -m "FIX: bug"           # ❌ Type must be lowercase
```

**Allowed types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

See [GIT_HOOKS.md](./GIT_HOOKS.md) for complete guidelines.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and coding standards.

## Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions
- [GIT_HOOKS.md](./GIT_HOOKS.md) - Git hooks and commit standards
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Architecture overview

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

- ✅ Linting (ESLint)
- ✅ Formatting check (Prettier)
- ✅ Commit message validation
- ✅ TypeScript build
- ✅ Unit tests

## License

ISC