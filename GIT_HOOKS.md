# Git Hooks & Commit Standards

## Overview

This project enforces code quality and commit message standards using **Husky** and **lint-staged**.

## Installed Hooks

### 1. Pre-commit Hook

**Location**: `.husky/pre-commit`

**Purpose**: Enforce code quality before commits

**What it does**:

- Runs ESLint on staged `.ts` files and auto-fixes issues
- Runs Prettier on staged files to ensure consistent formatting
- Prevents commits if linting fails

**Files checked**:

- `*.ts` → ESLint + Prettier
- `*.{js,json,md,yml,yaml}` → Prettier

**Configuration**: `.lintstagedrc.js`

### 2. Commit-msg Hook

**Location**: `.husky/commit-msg`

**Purpose**: Enforce conventional commit message format

**What it does**:

- Validates commit messages against conventional commit standards
- Prevents commits with invalid message formats

**Configuration**: `commitlint.config.js`

## Commit Message Format

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | Description                                              |
| ---------- | -------------------------------------------------------- |
| `feat`     | New feature                                              |
| `fix`      | Bug fix                                                  |
| `docs`     | Documentation changes                                    |
| `style`    | Code style changes (formatting, missing semicolons, etc) |
| `refactor` | Code refactoring                                         |
| `perf`     | Performance improvements                                 |
| `test`     | Adding or updating tests                                 |
| `chore`    | Maintenance tasks                                        |
| `ci`       | CI/CD configuration changes                              |
| `build`    | Build system or dependency changes                       |
| `revert`   | Revert a previous commit                                 |

### Commit Message Rules

✅ **Valid Examples**:

```bash
feat: add user authentication module
fix: resolve memory leak in request handler
docs: update API documentation
refactor(user): simplify validation logic
feat(api)!: change response format (BREAKING CHANGE)
```

❌ **Invalid Examples**:

```bash
Added new feature          # Missing type
FIX: bug fix              # Type must be lowercase
feat:add feature          # Missing space after colon
feat: Add feature.        # Subject ends with period
feat: THIS IS UPPERCASE   # Subject in uppercase
```

### Commit Message Rules Enforced

- **Type required**: Must start with a valid type
- **Type lowercase**: Type must be lowercase
- **Subject required**: Must have a description
- **No trailing period**: Subject must not end with `.`
- **No uppercase subject**: Subject must not be in uppercase
- **Max header length**: 100 characters
- **Scope lowercase**: Optional scope must be lowercase

### Breaking Changes

For breaking changes, add `!` after the type/scope or include `BREAKING CHANGE:` in the footer:

```bash
feat!: remove deprecated API endpoints

BREAKING CHANGE: The /v1/users endpoint has been removed
```

## How to Use

### Normal Workflow

```bash
# Stage your changes
git add .

# Commit (pre-commit hook runs automatically)
git commit -m "feat: add new feature"

# If hooks fail, fix the issues and try again
pnpm lint:fix
git add .
git commit -m "feat: add new feature"
```

### What Happens During Commit

1. **Pre-commit hook triggers**
   - lint-staged runs on staged files
   - ESLint checks and auto-fixes TypeScript files
   - Prettier formats all staged files
   - If errors remain, commit is blocked

2. **Commit message validation**
   - commitlint validates the message format
   - If invalid, commit is rejected with error details

### Bypassing Hooks (NOT RECOMMENDED)

⚠️ **DO NOT** use `--no-verify` unless absolutely necessary:

```bash
git commit --no-verify -m "message"  # ❌ Bypasses all hooks
```

**Why not to bypass**:

- Breaks code quality standards
- CI will fail anyway
- Creates inconsistent commit history
- Violates company standards

## CI Enforcement

All checks enforced locally are **re-run in CI** (`.github/workflows/ci.yml`):

| Local Hook | CI Job      | Purpose                   |
| ---------- | ----------- | ------------------------- |
| pre-commit | `lint` job  | ESLint + Prettier         |
| commit-msg | `lint` job  | Commit message validation |
| -          | `build` job | TypeScript compilation    |
| -          | `test` job  | Unit tests                |

**This ensures**:

- No one can push bad code even if hooks are bypassed
- PRs cannot be merged without passing checks
- Code quality is enforced at multiple levels

## Troubleshooting

### Hooks Not Running

```bash
# Reinstall Husky
rm -rf .husky
pnpm prepare

# Make hooks executable (Linux/Mac)
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Lint-staged Not Working

```bash
# Clear cache
pnpm exec lint-staged --debug

# Check configuration
cat .lintstagedrc.js
```

### Commit Message Rejected

```bash
# Test your commit message
echo "feat: your message" | pnpm exec commitlint

# See detailed errors
pnpm exec commitlint --help-url
```

### ESLint Errors Can't Be Auto-fixed

```bash
# Fix manually
pnpm lint:fix

# Check what's failing
pnpm lint
```

## Configuration Files

| File                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `.husky/pre-commit`    | Pre-commit hook script         |
| `.husky/commit-msg`    | Commit message validation hook |
| `.lintstagedrc.js`     | lint-staged configuration      |
| `commitlint.config.js` | commitlint rules               |
| `.eslintrc.json`       | ESLint rules                   |
| `.prettierrc`          | Prettier formatting rules      |
| `.prettierignore`      | Files ignored by Prettier      |

## Maintenance

### Adding New File Types

Edit `.lintstagedrc.js`:

```javascript
module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{js,json,md,yml,yaml}': ['prettier --write'],
  '*.css': ['prettier --write'], // Add this
};
```

### Modifying Commit Rules

Edit `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 120], // Change from 100 to 120
  },
};
```

### Adding New Hooks

```bash
# Create new hook
pnpm exec husky add .husky/pre-push "pnpm test"

# Make executable (Linux/Mac)
chmod +x .husky/pre-push
```

⚠️ **Note**: Company standard does NOT allow pre-push hooks for tests.

## Best Practices

1. **Commit often** with small, focused changes
2. **Write clear** commit messages
3. **Fix issues** flagged by hooks immediately
4. **Don't bypass** hooks without team approval
5. **Update hooks** when standards change
6. **Test locally** before pushing

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [commitlint Documentation](https://commitlint.js.org/)

## Support

For questions or issues with Git hooks:

- Check this document first
- Review `.github/workflows/ci.yml` for CI alignment
- Contact Platform Team for standard changes
