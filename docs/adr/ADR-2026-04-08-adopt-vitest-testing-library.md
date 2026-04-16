---
id: ADR-2026-04-08-adopt-vitest-testing-library
title: Adopt Vitest + Testing Library as the unit testing stack
status: accepted
date: 2026-04-08
deciders: [tom]
tags: [testing, tooling, vite]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-08 error-handling-polish
---

## Context

Before this session the project had no automated unit test framework.
Two needs converged that forced a decision:

1. A `StationListView` pagination change (progressive scroll loading,
   see related ADR) was suspected of not firing. Without tests, the
   only way to confirm the logic worked was to load >20 stations in
   the UI and scroll — a manual check with ambiguous results.
2. A set of Overpass error-handling fixes (network retry across
   mirrors, server-timeout detection via the `remark` field) added
   branching logic to `src/lib/overpass.ts` that was hard to exercise
   manually — each path requires a specific failure mode.

Both of these are the kind of logic that rots silently without a test
safety net, and both are central to the app's behaviour. Adding tests
at this point was the cheapest moment — the code was fresh and the
edge cases were still in mind.

## Decision

Adopt **Vitest** as the unit test runner, with
**`@testing-library/react`** and **`@testing-library/jest-dom`** for
component assertions and **`jsdom`** as the DOM environment.

Concretely:

- `vite.config.ts` gains a `test` block (`environment: "jsdom"`,
  `globals: true`, `setupFiles: ["./src/test/setup.ts"]`, `css: false`,
  `exclude: ["**/node_modules/**", "**/e2e/**"]`).
- `tsconfig.app.json` adds `"vitest/globals"` to `types` and excludes
  `src/**/*.test.ts(x)` from the build.
- `package.json` gains `"test": "vitest run"` and `"test:watch":
  "vitest"` scripts; Playwright (already present for E2E) stays under
  `test:e2e`.
- Unit tests are **co-located** with the source file they cover
  (`StationListView.test.tsx` next to `StationListView.tsx`).
- Test conventions: `describe` / `it` / `expect` / `vi.fn()` /
  `vi.spyOn()`; `vi.restoreAllMocks()` in `afterEach`;
  `localStorage.clear()` around cache tests; prefer
  `screen.getByRole()` over CSS selectors.

## Alternatives considered

- **Jest** — rejected. Vite is the build tool; Vitest shares Vite's
  config and transformer, eliminates the babel/ts-jest configuration
  surface, and handles ESM natively. Jest would require a parallel
  toolchain for TS/ESM transformation.
- **Playwright-only (E2E for everything)** — rejected. Playwright is
  already wired up, but E2E tests are too slow and too coarse for
  verifying pagination state transitions or mirror-fallback behaviour.
  They stay for user-flow coverage; Vitest fills the unit gap.
- **No test framework, manual verification only** — rejected. That is
  how we got to "is pagination even firing?" in the first place.

## Consequences

- **Positive:**
  - Logic-heavy modules (`overpass.ts`, `stationCache.ts`, `useStationQuery`,
    pagination in `StationListView`) now have a cheap way to catch
    regressions.
  - Shared config with Vite — adding a test to a new file requires
    no per-file setup.
  - Vitest's `globals: true` keeps tests concise (no per-file
    imports of `describe` / `it` / `expect`).
- **Negative:**
  - Adds `vitest`, `@testing-library/react`, `@testing-library/jest-dom`,
    `@testing-library/dom`, and `jsdom` to dev dependencies — non-trivial
    install surface.
  - `globals: true` loses some IDE/typescript explicitness; compensated
    by the `vitest/globals` type reference.
  - Introduces a second test runner alongside Playwright. Contributors
    must know which to use when (unit vs E2E).
- **Follow-ups:**
  - Co-locate new tests with source; do not create a separate `tests/`
    root.
  - When CI is set up (not in scope for this session), both `npm run
    test` and `npm run test:e2e` should gate merges.

## Notes

Initial tests written in the same session:

- `src/components/StationListView.test.tsx` — pagination (9 tests:
  initial render cap, hint display, scroll-to-load, reset on prop
  change, edge cases).
- `src/lib/overpass.test.ts` — error handling (9 tests: success, HTTP
  429/5xx retry, `TypeError` retry, `remark` timeout detection,
  non-retryable errors, `AbortError`, all-mirrors-fail).

18/18 passed on first run after framework setup, which directly
resolved the "is pagination actually firing?" doubt that originally
prompted adding tests.
