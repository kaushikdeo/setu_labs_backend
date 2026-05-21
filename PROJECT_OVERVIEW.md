# Project Overview

## Summary

This is the **official company standard Node.js + Express + TypeScript template** as defined in `System_documents/initial.md`.

## What Has Been Created

### Configuration Files

| File             | Purpose                           |
| ---------------- | --------------------------------- |
| `package.json`   | Dependencies and scripts          |
| `tsconfig.json`  | TypeScript compiler configuration |
| `.eslintrc.json` | ESLint rules                      |
| `.eslintignore`  | ESLint ignore patterns            |
| `.prettierrc`    | Prettier formatting rules         |
| `.editorconfig`  | Editor configuration              |
| `.gitignore`     | Git ignore patterns               |
| `jest.config.js` | Jest testing configuration        |

### Environment Files

| File               | Purpose                       |
| ------------------ | ----------------------------- |
| `.env.example`     | Example environment variables |
| `.env.development` | Development configuration     |
| `.env.qa`          | QA configuration              |
| `.env.production`  | Production configuration      |

Note: `.env.*` files (except `.env.example`) are git-ignored.

### Source Code Structure

```
src/
├── server.ts                    # Application entry point
├── app.ts                       # Express app configuration
├── config/
│   ├── env.ts                  # Environment loader with validation
│   └── logger.ts               # Winston logger setup
├── middlewares/
│   ├── validate.middleware.ts   # Joi validation middleware
│   ├── error.middleware.ts      # Centralized error handler
│   └── request-logger.middleware.ts  # Request logging
├── modules/
│   └── user/                    # Example user module
│       ├── user.route.ts       # Route definitions
│       ├── user.controller.ts  # Request handlers
│       ├── user.service.ts     # Business logic
│       └── user.schema.ts      # Joi validation schemas
├── types/
│   ├── index.ts                # Type definitions
│   └── express.d.ts            # Express type extensions
└── utils/
    └── index.ts                # Utility functions
```

### Testing

```
tests/
└── user.test.ts                # Example Jest tests
```

### Git Hooks

```
.husky/
├── _/
│   └── husky.sh               # Husky helper script
└── pre-commit                 # Pre-commit hook (runs lint-staged)
```

## Architecture

### Layered Module Design

Each module follows a strict 4-layer architecture:

1. **Route Layer** (`*.route.ts`)
   - Defines HTTP endpoints
   - Registers middleware
   - Maps routes to controllers

2. **Controller Layer** (`*.controller.ts`)
   - Handles HTTP requests/responses
   - Calls service layer
   - Returns formatted responses

3. **Service Layer** (`*.service.ts`)
   - Contains business logic
   - No HTTP concerns
   - Reusable across different controllers

4. **Schema Layer** (`*.schema.ts`)
   - Joi validation schemas
   - Request validation rules

### Middleware Stack

```
Request → requestLogger → routes → validate → controller → service
                                                    ↓
                                                   Error
                                                    ↓
                                             errorHandler
```

## Key Features

### ✅ Environment Management

- Separate configs for dev/qa/prod
- Automatic environment loading based on `NODE_ENV`
- Joi validation for environment variables
- Type-safe environment access

### ✅ Logging (Winston)

- Structured logging
- Different log levels per environment
- Centralized logger instance
- `console.log` is forbidden (enforced by ESLint)

### ✅ Validation (Joi)

- All API requests validated
- Schema-based validation
- Automatic error responses
- Type-safe after validation

### ✅ Error Handling

- Centralized error middleware
- Custom `AppError` class
- Automatic error logging
- Safe error responses (no stack traces in production)

### ✅ Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: No console.log, TypeScript rules
- **Prettier**: Consistent formatting
- **Husky**: Pre-commit hooks
- **lint-staged**: Only lint changed files

### ✅ Testing

- Jest configured
- Example test included
- Coverage reporting

## Compliance with Company Standard

This template fully implements the requirements from `System_documents/initial.md`:

| Requirement                    | Status | Implementation                                 |
| ------------------------------ | ------ | ---------------------------------------------- |
| Node.js + Express + TypeScript | ✅     | All configured                                 |
| Winston logging                | ✅     | `src/config/logger.ts`                         |
| Joi validation                 | ✅     | `src/middlewares/validate.middleware.ts`       |
| ESLint + Prettier              | ✅     | Configuration files present                    |
| Husky + lint-staged            | ✅     | `.husky/` directory                            |
| Jest testing                   | ✅     | `jest.config.js`                               |
| Environment config (dotenv)    | ✅     | `src/config/env.ts`                            |
| Folder structure               | ✅     | Matches specification exactly                  |
| Module design (4 layers)       | ✅     | User module as example                         |
| Centralized error handling     | ✅     | `src/middlewares/error.middleware.ts`          |
| Request logging                | ✅     | `src/middlewares/request-logger.middleware.ts` |
| No console.log                 | ✅     | ESLint rule enforces this                      |

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Run development server**

   ```bash
   pnpm dev
   ```

3. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

See `SETUP_GUIDE.md` for detailed instructions.

## Next Steps

### Recommended Enhancements (from standard doc)

- [ ] OpenAPI/Swagger documentation
- [ ] Docker containerization
- [ ] CI/CD pipeline configuration
- [ ] Authentication/authorization baseline
- [ ] Database integration
- [ ] Observability/monitoring integration

### Adding Your First Feature

1. Create a new module in `src/modules/`
2. Follow the 4-layer pattern (route, controller, service, schema)
3. Register routes in `src/app.ts`
4. Add tests in `tests/`

## Scripts Reference

| Script      | Command         | Purpose               |
| ----------- | --------------- | --------------------- |
| Development | `pnpm dev`      | Start with hot reload |
| Build       | `pnpm build`    | Compile TypeScript    |
| Production  | `pnpm start`    | Run compiled code     |
| Lint        | `pnpm lint`     | Check code quality    |
| Lint Fix    | `pnpm lint:fix` | Auto-fix issues       |
| Format      | `pnpm format`   | Format with Prettier  |
| Test        | `pnpm test`     | Run Jest tests        |

## Documentation Files

- `README.md` - Quick start guide
- `SETUP_GUIDE.md` - Detailed setup instructions
- `PROJECT_OVERVIEW.md` - This file (architecture overview)
- `System_documents/initial.md` - Official company standard

## Maintenance

- Template version: 1.0.0
- Owner: Company Platform Team
- Last updated: 2026-01-13

## Support

For questions, issues, or suggestions:

- Contact: Platform Team
- Standard doc: `System_documents/initial.md`
