<!--
PR title must follow Conventional Commits: <type>(<scope>): <subject>
We squash-merge, so the title becomes the single commit on `main`.
Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
Full spec & recommended scopes: CONTRIBUTING.md#commit-messages
-->

## Summary
<!-- What does this PR do? Why? -->


## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / code quality
- [ ] Docs / content
- [ ] Chore (deps, config, CI)

## Test plan
<!-- How did you verify this works? Screenshots welcome for UI changes. -->


## Checklist

### Build & Lint
- [ ] `npm run lint` passes with no errors or warnings
- [ ] `npm run build` passes locally

### Accessibility (a11y)
- [ ] No new contrast issues (WCAG AA: 4.5:1 text, 3:1 large text)
- [ ] All interactive elements have accessible names (`aria-label`, `aria-labelledby`, or visible label)
- [ ] ARIA landmarks, roles, and live regions preserved
- [ ] No `aria-*` attributes referencing non-existent IDs
- [ ] Axe scan run on touched route(s)

### Dialog & Keyboard
- [ ] Dialog/modal focus trap, Escape-to-close, and focus-return-to-trigger verified (if applicable)

### Dark Mode
- [ ] No hardcoded colors without `dark:` variants
- [ ] Dark mode and light mode tested

### i18n Readiness
- [ ] No new hardcoded user-facing strings in TSX
- [ ] No string concatenation that would break translation (use template placeholders)

### MD3 Compliance
- [ ] Touch targets meet 48x48 dp minimum on interactive elements
- [ ] Colors use project token structure (primary/secondary/tertiary/error), not ad-hoc hex values
- [ ] State layers (hover, focus, pressed) present on interactive surfaces

### Data Flow
- [ ] `useCallback`/`useMemo`/`React.memo` dependency arrays are correct (if applicable)
- [ ] Context value objects are wrapped in `useMemo` (if providers were modified)
- [ ] No new prop-drilling that bypasses existing Context hooks
- [ ] Cache invalidation logic intact (if `stationCache.ts` or `useStationQuery.ts` was touched)

### Responsive
- [ ] Mobile viewport tested at 375px width (or change is not UI-related)
- [ ] No horizontal overflow introduced

### Docs
- [ ] README or docs updated (if user-facing feature)
- [ ] `.env.example` updated (if new env vars added)
