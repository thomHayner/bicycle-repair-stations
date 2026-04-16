---
id: ADR-2026-04-15-tsconfig-excludes-test-files
title: Exclude test files from tsconfig.app.json to prevent build-time type errors
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [build, tooling, typescript, testing]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 vercel-build-failure-fix
---

## Context

After adding Vitest unit tests co-located in `src/`, the Vercel production
build (`tsc -b && vite build`) began failing. `tsc -b` compiled the test
files alongside the application source and applied the production
`tsconfig.app.json` rules — including `noUnusedLocals: true` and
`noUnusedParameters: true`. Test files use patterns that are valid test
idioms but violate these rules: `_`-prefixed stub parameters, imported
Testing Library utilities used only in assertions, mock variables used only
as side effects, etc.

## Decision

Add an `exclude` field to `tsconfig.app.json` listing the test file globs:

```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
```

This keeps the production TypeScript compiler strict while allowing test
files to be compiled only by Vitest (which uses `tsconfig.test.json` /
Vite's own TypeScript pipeline and does not enforce the production strict
rules against test patterns).

## Alternatives considered

- **Relax `noUnusedLocals` / `noUnusedParameters` globally** — weakens
  production type safety to accommodate test idioms. Rejected.
- **Separate `tsconfig.test.json` that extends app config with overrides**
  — more complex, requires Vitest to be configured to use it explicitly.
  The exclude approach achieves the same result with one config change.
- **Move all tests outside `src/`** — breaks the co-location convention
  (test next to source) that makes tests easy to find and maintain.

## Consequences

- **Positive:** Production build is clean and strict; test files don't
  pollute `tsc -b` output.
- **Positive:** Test files can use test idioms freely without fighting the
  production type config.
- **Negative:** Test files have slightly less strict type-checking than
  production source (Vitest does type-check them, but without
  `noUnusedLocals: true`).
- **Follow-ups:** If Vitest is ever configured with a stricter tsconfig,
  this split may become unnecessary.

## Notes

The `api/` directory (Vercel edge/Node handlers) has its own
`tsconfig.json` and is not affected by this change. API test files
(`api/*.test.ts`) are compiled by Vitest separately and were already
excluded from the app tsconfig by directory boundary.
