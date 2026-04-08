# Base PR Review Checklist

Run every check below against the current branch's changed files. Report each item as PASS, FAIL, SKIP (not applicable), or WARN (potential issue). At the end, produce a summary table.

## Build & Lint
- [ ] Run `npm run lint` and report any errors or warnings.
- [ ] Run `npm run build` and confirm it succeeds with no errors.

## Accessibility (a11y)
- [ ] Inspect every changed/added TSX file for WCAG AA contrast compliance (4.5:1 for text, 3:1 for large text). Interactive elements should target AAA (7:1).
- [ ] Verify all interactive elements have accessible names (visible label, `aria-label`, or `aria-labelledby`). Never rely on `title` alone.
- [ ] Check that ARIA landmarks, roles, and live regions are preserved or correctly added.
- [ ] Confirm no `aria-*` attributes reference IDs that do not exist in the DOM.

## ARIA Semantics
- [ ] Verify landmark structure (`main`, `nav`, `region`) is intact in changed files.
- [ ] Check that any added/modified controls have appropriate roles and states (`aria-expanded`, `aria-pressed`, `aria-selected`, etc.).
- [ ] Confirm live regions (`aria-live`, `role="status"`, `role="alert"`) are used correctly for dynamic content.

## Dialog Keyboard Behavior
- [ ] If any modal, drawer, or dialog was added or changed: verify it implements focus trap, Escape-to-close, and focus-return-to-trigger.
- [ ] Check that `autoFocus` or programmatic `focus()` targets a sensible element on open.

## Dark Mode
- [ ] Inspect changed TSX/CSS for hardcoded colors that lack a `dark:` variant.
- [ ] Check for any `bg-white`, `text-black`, `border-gray-*` (or similar) without corresponding dark mode classes.
- [ ] Verify the theme toggle path in `SettingsContext.tsx` is not broken by changes.

## i18n Readiness
- [ ] Flag any new user-facing strings that are hardcoded in TSX (not extracted to a constant or translation-ready structure).
- [ ] Check for string concatenation that would break translator workflows (e.g., `"Found " + count + " stations"` instead of a template with a placeholder).
- [ ] Flag any new `Intl`-unaware date, number, or currency formatting.
- [ ] Note locale-sensitive content: plurals, directional text, date formats.

## MD3 (Material Design 3) Compliance
- [ ] Check that touch targets on interactive elements are at least 48x48 dp.
- [ ] Verify elevation/shadow usage follows MD3 surface tonal hierarchy (not arbitrary shadows).
- [ ] Confirm typography uses a consistent type scale (no arbitrary font sizes outside the Tailwind scale).
- [ ] Check that color usage aligns with a primary/secondary/tertiary/error token structure, not ad-hoc hex values.
- [ ] Verify state layers (hover, focus, pressed) exist on interactive surfaces.

## Data Flow Patterns
- [ ] If `useCallback`, `useMemo`, or `React.memo` was added: confirm the dependency arrays are correct and the memoization is justified (not premature).
- [ ] If Context providers were modified: verify the `useMemo` wrapping of context value objects (see `SettingsContext.tsx` pattern).
- [ ] Check that no new prop-drilling bypasses existing Context (e.g., threading `theme` manually when `useSettings()` exists).
- [ ] If caching logic was changed (`stationCache.ts`, `useStationQuery.ts`): verify cache invalidation and staleness logic is intact.
