# Contributing Guide

## Getting Started

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install`
3. **Create a branch**: `git checkout -b feat/your-feature`
4. **Make changes** following our standards
5. **Commit** with conventional commit messages
6. **Push** and create a Pull Request

## Development Workflow

### 1. Setup Your Environment

```bash
# Install dependencies
pnpm install

# This automatically runs 'pnpm prepare' which installs Husky hooks
```

### 2. Create a Feature Branch

```bash
# Feature branch
git checkout -b feat/user-profile

# Bug fix branch
git checkout -b fix/login-error

# Documentation branch
git checkout -b docs/api-endpoints
```

### 3. Make Your Changes

Follow the module structure:

```
src/modules/<feature>/
  ├── <feature>.route.ts      # HTTP routes
  ├── <feature>.controller.ts # Request handlers
  ├── <feature>.service.ts    # Business logic
  └── <feature>.schema.ts     # Joi validation
```

### 4. Write Tests

```bash
# Add tests in tests/ directory
tests/<feature>.test.ts

# Run tests
pnpm test
```

### 5. Commit Your Changes

**Format**: `<type>[optional scope]: <description>`

```bash
# Good commits
git commit -m "feat: add user profile endpoint"
git commit -m "fix: resolve authentication timeout"
git commit -m "docs: update API documentation"
git commit -m "refactor(auth): simplify token validation"

# The commit-msg hook will validate your message
```

See [GIT_HOOKS.md](./GIT_HOOKS.md) for complete commit message guidelines.

### 6. Push and Create PR

```bash
# Push your branch
git push origin feat/your-feature

# Create Pull Request on GitHub
# - Provide clear description
# - Link related issues
# - Request reviews
```

## Code Quality Standards

### Linting & Formatting

Code quality is **automatically enforced** via pre-commit hooks:

```bash
# Manual checks (optional)
pnpm lint             # Check for errors
pnpm lint:fix          # Auto-fix errors
pnpm format            # Format all files
```

**Pre-commit hook automatically**:

- Runs ESLint on staged `.ts` files
- Formats code with Prettier
- Blocks commit if errors remain

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- Export all interfaces/types
- Document complex types

### No console.log

❌ **Never use `console.log`**

```typescript
// Bad
console.log('User created');

// Good
import { logger } from '../config/logger';
logger.info('User created');
```

ESLint will **block commits** with `console.log`.

## Commit Message Standards

### Required Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code change (not fix/feature)
- `perf`: Performance improvement
- `test`: Add/update tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Simple feature
git commit -m "feat: add email validation"

# With scope
git commit -m "feat(auth): add JWT token refresh"

# Bug fix
git commit -m "fix: resolve null pointer in user service"

# Breaking change
git commit -m "feat!: change API response format"

# With body
git commit -m "refactor: simplify error handling

Moved error handling logic to centralized middleware
for better consistency across all routes."
```

### Rules

✅ Type must be lowercase  
✅ Space after colon  
✅ Subject must not end with `.`  
✅ Subject must not be uppercase  
✅ Max 100 characters for header

❌ `Feat: add feature` (uppercase type)  
❌ `feat:add feature` (no space)  
❌ `feat: Add feature.` (ends with period)

## Module Development

### Creating a New Module

1. **Create module directory**:

```bash
mkdir -p src/modules/product
```

2. **Create required files**:

```typescript
// product.schema.ts
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
});

// product.service.ts
export class ProductService {
  async createProduct(data: any) {
    // Business logic here
  }
}

// product.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new ProductService();
      const result = await service.createProduct(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

// product.route.ts
import { Router } from 'express';
import { ProductController } from './product.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema } from './product.schema';

const router = Router();
const controller = new ProductController();

router.post('/', validate(createProductSchema), controller.create);

export default router;
```

3. **Register routes**:

```typescript
// src/app.ts
import productRoutes from './modules/product/product.route';

app.use('/api/products', productRoutes);
```

### Layer Responsibilities

| Layer      | File              | Responsibility       |
| ---------- | ----------------- | -------------------- |
| Route      | `*.route.ts`      | Define endpoints     |
| Controller | `*.controller.ts` | Handle HTTP concerns |
| Service    | `*.service.ts`    | Business logic       |
| Schema     | `*.schema.ts`     | Request validation   |

**Rules**:

- ❌ No business logic in controllers
- ❌ No HTTP concerns in services
- ✅ Services are reusable
- ✅ All requests must be validated

## Testing

### Writing Tests

```typescript
// tests/product.test.ts
import { ProductService } from '../src/modules/product/product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService();
  });

  it('should create a product', async () => {
    const data = { name: 'Test', price: 100 };
    const result = await service.createProduct(data);
    expect(result).toHaveProperty('id');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

## Error Handling

### Use AppError for Known Errors

```typescript
import { AppError } from '../../middlewares/error.middleware';

// In your service
if (!user) {
  throw new AppError(404, 'User not found');
}

if (!hasPermission) {
  throw new AppError(403, 'Access denied');
}
```

### Let Middleware Handle Errors

```typescript
// In controller
try {
  const result = await service.method();
  res.json({ success: true, data: result });
} catch (error) {
  next(error); // Pass to error middleware
}
```

## Environment Variables

### Adding New Variables

1. **Add to env files**:

```bash
# .env.example
NEW_VAR=example_value

# .env.development
NEW_VAR=dev_value
```

2. **Add validation**:

```typescript
// src/config/env.ts
const envSchema = Joi.object({
  // ... existing
  NEW_VAR: Joi.string().required(),
}).unknown();

export const env = {
  // ... existing
  newVar: value.NEW_VAR,
};
```

## Pull Request Guidelines

### PR Checklist

Before creating a PR, ensure:

- ✅ Code builds successfully (`pnpm build`)
- ✅ All tests pass (`pnpm test`)
- ✅ Linting passes (`pnpm lint`)
- ✅ Code is formatted (`pnpm format`)
- ✅ Commit messages follow convention
- ✅ No `console.log` statements
- ✅ New features have tests
- ✅ Documentation is updated

### PR Title

Use the same format as commit messages:

```
feat: add product management API
fix: resolve authentication bug
docs: update setup guide
```

### PR Description

Include:

1. **What** - What changes were made?
2. **Why** - Why were these changes needed?
3. **How** - How do the changes work?
4. **Testing** - How was this tested?
5. **Screenshots** - If UI changes (N/A for backend)

### Review Process

1. CI checks must pass
2. At least 1 approval required
3. All conversations must be resolved
4. No merge conflicts

## Common Issues

### Pre-commit Hook Fails

```bash
# Check what's failing
git commit -m "test"

# Fix linting issues
pnpm lint:fix

# Try again
git add .
git commit -m "feat: your message"
```

### Commit Message Rejected

```bash
# Test your message
echo "feat: your message" | pnpm exec commitlint

# Fix and retry
git commit -m "feat: properly formatted message"
```

### TypeScript Build Errors

```bash
# Check errors
pnpm build

# Fix and rebuild
pnpm build
```

## Resources

- [GIT_HOOKS.md](./GIT_HOOKS.md) - Git hooks details
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup instructions
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Architecture overview
- [System_documents/initial.md](./System_documents/initial.md) - Company standard

## Questions?

Contact the Platform Team or open an issue.
