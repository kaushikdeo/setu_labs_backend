# Husky Implementation - Complete Reference

## Overview

This document details the complete Husky and Git hooks implementation for this project, following the **Company Backend Standard**.

## ✅ Implementation Checklist

### Dependencies Installed

- [x] `husky` - Git hooks management
- [x] `lint-staged` - Run linters on staged files
- [x] `eslint` - Code linting
- [x] `prettier` - Code formatting
- [x] `@commitlint/cli` - Commit message validation
- [x] `@commitlint/config-conventional` - Conventional commits config

### Configuration Files Created

- [x] `package.json` - Scripts and dependencies
- [x] `.husky/pre-commit` - Pre-commit hook
- [x] `.husky/commit-msg` - Commit message validation hook
- [x] `.husky/_/husky.sh` - Husky helper script
- [x] `.lintstagedrc.js` - lint-staged configuration
- [x] `commitlint.config.js` - commitlint rules
- [x] `.prettierrc` - Prettier formatting rules
- [x] `.prettierignore` - Prettier ignore patterns
- [x] `.eslintrc.json` - ESLint rules
- [x] `.eslintignore` - ESLint ignore patterns

### Documentation Created

- [x] `GIT_HOOKS.md` - Complete Git hooks guide
- [x] `CONTRIBUTING.md` - Development workflow
- [x] `README.md` - Updated with hooks info
- [x] `SETUP_GUIDE.md` - Enhanced with hooks setup

### CI/CD Integration

- [x] `.github/workflows/ci.yml` - GitHub Actions workflow
  - Linting check
  - Formatting check
  - Commit message validation
  - Build verification
  - Test execution

## 📋 Hooks Implemented

### 1. Pre-commit Hook

**File**: `.husky/pre-commit`

**Purpose**: Enforce code quality before commits

**What it runs**:

```bash
pnpm exec lint-staged
```

**Configured in**: `.lintstagedrc.js`

```javascript
module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{js,json,md,yml,yaml}': ['prettier --write'],
};
```

**Files affected**:

- TypeScript files (`.ts`) → ESLint + Prettier
- JavaScript, JSON, Markdown, YAML → Prettier only

**Behavior**:

- Runs only on **staged** files (efficient)
- Auto-fixes issues when possible
- **Blocks commit** if unfixable errors remain
- Only checks files being committed

### 2. Commit-msg Hook

**File**: `.husky/commit-msg`

**Purpose**: Validate commit message format

**What it runs**:

```bash
pnpm exec commitlint --edit "$1"
```

**Configured in**: `commitlint.config.js`

**Rules enforced**:

- Message must follow: `<type>[optional scope]: <description>`
- Type must be lowercase
- Type must be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
- Subject must not be uppercase
- Subject must not end with `.`
- Header max length: 100 characters
- Scope must be lowercase (if provided)

**Behavior**:

- Validates every commit message
- **Rejects invalid** formats immediately
- Provides clear error messages
- Enforces consistency across team

## 🚫 Constraints Followed

✅ **NO** `pre-push` hooks - Tests run in CI, not locally  
✅ **NO** `post-commit` hooks - Not needed per standard  
✅ **NO** `post-merge` hooks - Not needed per standard  
✅ **NO** unit tests in pre-commit - Only linting/formatting  
✅ **NO** build in pre-commit - Only code quality checks  
✅ **NO** `--no-verify` bypass - Enforced through team policy

## 📦 Package.json Configuration

### Scripts

```json
{
  "scripts": {
    "prepare": "husky install", // Auto-install hooks on pnpm install
    "dev": "...",
    "build": "tsc",
    "start": "...",
    "lint": "eslint . --ext .ts", // Check all files
    "lint:fix": "eslint . --ext .ts --fix", // Auto-fix all files
    "format": "prettier --write .", // Format all files
    "test": "jest"
  }
}
```

### lint-staged Configuration

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{js,json,md,yml,yaml}": ["prettier --write"]
  }
}
```

## 🔧 Commitlint Configuration

**File**: `commitlint.config.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'build',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
};
```

**Rule format**: `[level, applicable, value]`

- `0` = disabled
- `1` = warning
- `2` = error

## 🔄 Workflow Integration

### Local Development

```bash
# Developer makes changes
git add src/modules/user/user.service.ts

# Developer commits
git commit -m "feat: add user service"

# Pre-commit hook runs automatically:
# 1. lint-staged starts
# 2. ESLint checks user.service.ts
# 3. Prettier formats user.service.ts
# 4. If errors, commit is blocked
# 5. If success, commit continues

# Commit-msg hook runs automatically:
# 1. commitlint validates message format
# 2. If invalid, commit is blocked with error
# 3. If valid, commit succeeds

# Developer pushes
git push origin feat/user-service

# CI runs (GitHub Actions):
# 1. Lint job - ESLint on all files
# 2. Lint job - Prettier check on all files
# 3. Lint job - commitlint on all commits
# 4. Build job - TypeScript compilation
# 5. Test job - Jest tests
```

### CI/CD Alignment

| Local Hook   | CI Job      | Purpose                |
| ------------ | ----------- | ---------------------- |
| `pre-commit` | `lint` job  | ESLint validation      |
| `pre-commit` | `lint` job  | Prettier formatting    |
| `commit-msg` | `lint` job  | Commit message format  |
| -            | `build` job | TypeScript compilation |
| -            | `test` job  | Unit tests             |

**This ensures**:

- No bypass of local checks (CI enforces again)
- Consistent standards across team
- Early feedback (local) + safety net (CI)

## ✅ Validation & Testing

### Test Pre-commit Hook

```bash
# Make a change with linting error
echo "console.log('test')" >> src/test.ts
git add src/test.ts
git commit -m "test: testing hook"

# Expected: Commit blocked due to console.log
```

### Test Commit-msg Hook

```bash
# Valid commits
git commit -m "feat: add feature" --allow-empty       # ✅ Pass
git commit -m "fix(auth): fix bug" --allow-empty      # ✅ Pass
git commit -m "docs: update readme" --allow-empty     # ✅ Pass

# Invalid commits
git commit -m "Added feature" --allow-empty           # ❌ Fail - no type
git commit -m "FIX: bug" --allow-empty                # ❌ Fail - uppercase type
git commit -m "feat: Add feature." --allow-empty      # ❌ Fail - ends with period
git commit -m "feat:no space" --allow-empty           # ❌ Fail - no space after :
```

### Test lint-staged

```bash
# Check configuration
pnpm exec lint-staged --debug

# Manual run
pnpm exec lint-staged
```

### Verify Husky Installation

```bash
# Check hooks directory
ls -la .husky/

# Should show:
# - pre-commit (executable)
# - commit-msg (executable)
# - _/husky.sh (helper script)

# Verify hooks are registered
cat .git/hooks/pre-commit  # Should reference Husky
```

## 🔍 Troubleshooting

### Hooks Not Running

**Problem**: Commits succeed without running hooks

**Solutions**:

```bash
# Reinstall Husky
rm -rf .husky
pnpm prepare

# On Linux/Mac, ensure executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Verify Git hooks
cat .git/hooks/pre-commit
```

### lint-staged Not Working

**Problem**: Pre-commit runs but doesn't lint files

**Solutions**:

```bash
# Test lint-staged directly
pnpm exec lint-staged --debug

# Check configuration
cat .lintstagedrc.js

# Verify ESLint works
pnpm lint
```

### commitlint Rejecting Valid Messages

**Problem**: Commit message looks correct but rejected

**Solutions**:

```bash
# Test message format
echo "feat: my feature" | pnpm exec commitlint

# Check configuration
cat commitlint.config.js

# See detailed error
pnpm exec commitlint --help-url
```

### Windows-Specific Issues

**Problem**: Hooks not executable on Windows

**Solution**: Hooks should work via Git Bash or WSL. If issues:

```bash
# Ensure running in Git Bash (not Command Prompt)
# Or use WSL

# Verify Node and pnpm are in PATH
which node
which pnpm
```

## 📊 Enforcement Levels

### Level 1: Local Pre-commit (Fast Feedback)

- Runs on staged files only
- Auto-fixes when possible
- Immediate feedback
- Developer friendly

### Level 2: Local Commit-msg (Immediate Validation)

- Validates message format
- Blocks bad commits instantly
- No bypass without `--no-verify`
- Enforces standards

### Level 3: CI/CD (Safety Net)

- Runs on all files
- No auto-fix (check only)
- Blocks PRs with issues
- Cannot be bypassed

## 🎯 Success Criteria

✅ Hooks install automatically on `pnpm install`  
✅ Pre-commit blocks commits with linting errors  
✅ Pre-commit auto-formats code  
✅ Commit-msg blocks invalid message formats  
✅ CI re-validates all checks  
✅ No way to bypass without explicit `--no-verify`  
✅ Clear error messages for developers  
✅ Works on Windows, Linux, and Mac  
✅ Deterministic and reproducible  
✅ Documentation complete

## 📚 Related Documentation

- [GIT_HOOKS.md](./GIT_HOOKS.md) - Detailed Git hooks guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow
- [README.md](./README.md) - Project overview
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup instructions
- `.github/workflows/ci.yml` - CI configuration

## 🔐 Security & Best Practices

### ✅ DO

- Commit early and often with small changes
- Write clear, descriptive commit messages
- Fix linting issues immediately
- Keep hooks lightweight (no tests/builds)
- Update documentation when changing standards

### ❌ DON'T

- Bypass hooks with `--no-verify` (without approval)
- Commit directly to main/master
- Use uppercase in commit types
- End commit subjects with periods
- Include `console.log` statements
- Skip CI checks

## 🚀 Future Enhancements (Optional)

Potential improvements (not in current scope):

- [ ] Add `@commitlint/prompt-cli` for interactive commits
- [ ] Add commit message templates
- [ ] Add Danger.js for PR automation
- [ ] Add conventional-changelog for release notes
- [ ] Add semantic-release for automated versioning

## 📞 Support

For issues or questions:

- Review documentation first
- Check troubleshooting section
- Verify CI logs
- Contact Platform Team

## ✅ Implementation Complete

All objectives met:

1. ✅ Husky installed and configured
2. ✅ Pre-commit quality checks with lint-staged
3. ✅ Commit message standards with commitlint
4. ✅ Works with pnpm scaffolding (prepare script)
5. ✅ Local hooks aligned with CI enforcement

**Status**: Production ready ✅
