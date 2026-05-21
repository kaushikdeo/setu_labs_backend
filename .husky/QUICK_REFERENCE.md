# Git Hooks Quick Reference

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

## Valid Commit Types

| Type       | Use For                             |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `docs`     | Documentation only                  |
| `style`    | Code style (formatting, semicolons) |
| `refactor` | Code refactoring (no fix/feature)   |
| `perf`     | Performance improvement             |
| `test`     | Add/update tests                    |
| `chore`    | Maintenance tasks                   |
| `ci`       | CI/CD changes                       |
| `build`    | Build system/dependencies           |
| `revert`   | Revert previous commit              |

## Examples

### ✅ Valid Commits

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve memory leak in handler"
git commit -m "docs: update API documentation"
git commit -m "refactor(auth): simplify token validation"
git commit -m "feat(api)!: change response format"
git commit -m "fix: correct typo in error message"
```

### ❌ Invalid Commits

```bash
git commit -m "Added feature"           # Missing type
git commit -m "FIX: bug"                # Type must be lowercase
git commit -m "feat:no space"           # Missing space after colon
git commit -m "feat: Add feature."      # Subject ends with period
git commit -m "feat: UPPERCASE"         # Subject in uppercase
git commit -m "update: docs"            # Invalid type
```

## Common Issues

### Pre-commit Failed

```bash
# Fix linting errors
pnpm lint:fix

# Stage fixes and retry
git add .
git commit -m "your message"
```

### Commit Message Rejected

```bash
# Test your message
echo "feat: your message" | pnpm exec commitlint

# Use correct format
git commit -m "type: description"
```

## Rules

- Type: **required**, **lowercase**
- Colon: **space after**
- Description: **required**, **no period**, **not uppercase**
- Header: **max 100 chars**
- Scope: **optional**, **lowercase**

## Help

See [GIT_HOOKS.md](../GIT_HOOKS.md) for complete documentation.
