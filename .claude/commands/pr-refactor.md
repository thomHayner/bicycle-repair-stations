# Refactor PR Review

You are reviewing a PR that is a **significant refactoring**. Read and execute every check in `.claude/commands/_base-review.md` first, then continue with the additional checks below.

## Refactor-Specific Checks

### Behavioral Equivalence
- [ ] Verify no user-facing behavior changed unless explicitly intended. Compare the before/after of each modified component's props, return JSX, and side effects.
- [ ] If Context shape changed: confirm all consumers still receive the same fields.
- [ ] If hook signatures changed: confirm all call sites are updated.

### Import/Export Integrity
- [ ] Check for any broken re-exports (the project uses re-export patterns, e.g., `SettingsContext.tsx` re-exports `Theme`).
- [ ] Verify no circular dependencies were introduced.

### Dead Code
- [ ] Flag any functions, types, or imports that became unused after the refactor.
- [ ] Check for commented-out code that should be removed.

### Performance Regression
- [ ] If component tree structure changed: verify memoization boundaries are still correct.
- [ ] If data fetching moved between components: confirm no duplicate fetches occur.

### Type Safety
- [ ] Verify no new `any` types, `ts-ignore`, or `ts-expect-error` were introduced.
- [ ] Check that discriminated unions are still exhaustively handled.

## Output
Produce a summary table of all checks (base + refactor-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
