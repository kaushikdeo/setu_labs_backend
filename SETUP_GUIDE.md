# Setup Guide

## Initial Setup

After cloning this repository, follow these steps:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

The project includes `.env.example`. For local development, the `.env.development` file should already be present in your `.gitignore`.

Create your environment files if needed:

```bash
# Development environment (already exists)
# .env.development

# QA environment
# .env.qa

# Production environment
# .env.production
```

### 3. Initialize Husky

Husky hooks should be installed automatically after `pnpm install` via the `prepare` script. If not, run:

```bash
pnpm exec husky install
```

**Installed hooks**:

- `pre-commit` - Runs lint-staged (ESLint + Prettier on staged files)
- `commit-msg` - Validates commit message format using commitlint

**On Linux/Mac**, make hooks executable:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 4. Verify Setup

```bash
# Build the project
pnpm build

# Run linter
pnpm lint

# Run tests
pnpm test

# Test Git hooks (optional)
echo "test commit message" | pnpm exec commitlint  # Should fail
echo "feat: test commit" | pnpm exec commitlint   # Should pass
```

### 5. Start Development Server

```bash
pnpm dev
```

The server will start on the port specified in your `.env.development` file (default: 3000).

## Project Commands

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `pnpm dev`      | Start development server with hot reload |
| `pnpm build`    | Build TypeScript to JavaScript           |
| `pnpm start`    | Start production server                  |
| `pnpm lint`     | Run ESLint                               |
| `pnpm lint:fix` | Fix ESLint issues automatically          |
| `pnpm format`   | Format code with Prettier                |
| `pnpm test`     | Run Jest tests                           |

## Environment Variables

Each environment has its own `.env` file:

- **Development**: `.env.development` (Git ignored)
- **QA**: `.env.qa` (Git ignored)
- **Production**: `.env.production` (Git ignored)

Required variables:

```
NODE_ENV=development|qa|production
PORT=3000
LOG_LEVEL=debug|info|warn|error
```

## Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Get All Users

```bash
curl http://localhost:3000/api/users
```

### Get User by ID

```bash
curl http://localhost:3000/api/users/1234567890
```

## Adding a New Module

1. Create module directory: `src/modules/<module-name>/`
2. Create the following files:
   - `<module>.route.ts` - Define routes
   - `<module>.controller.ts` - Handle requests
   - `<module>.service.ts` - Business logic
   - `<module>.schema.ts` - Validation schemas
3. Register routes in `src/app.ts`

Example:

```typescript
// src/app.ts
import productRoutes from './modules/product/product.route';

app.use('/api/products', productRoutes);
```

## Code Quality Guidelines

### ESLint Rules

- No `console.log` statements (use Winston logger)
- Strict TypeScript checking enabled
- Prettier formatting enforced

### Pre-commit Hooks

Husky will automatically:

- Run ESLint on staged files
- Format code with Prettier
- Block commits if checks fail

## Deployment

### Building for Production

```bash
pnpm build
```

Output will be in the `dist/` directory.

### Running in Production

```bash
NODE_ENV=production pnpm start
```

## Troubleshooting

### Port Already in Use

Change the `PORT` in your `.env.development` file.

### Husky Hooks Not Working

Reinstall Husky:

```bash
rm -rf .husky
pnpm prepare
```

On Linux/Mac, ensure hooks are executable:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Commit Message Rejected

If your commit is rejected:

```bash
# Test your message format
echo "your message" | pnpm exec commitlint

# Valid format: <type>: <description>
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update readme"
```

See [GIT_HOOKS.md](./GIT_HOOKS.md) for complete commit message guidelines.

### TypeScript Errors

Ensure all dependencies are installed:

```bash
rm -rf node_modules
pnpm install
```

## Support

For questions or issues, contact the Platform Team.
