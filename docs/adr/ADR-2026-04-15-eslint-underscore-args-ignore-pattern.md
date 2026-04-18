---
id: ADR-2026-04-15-eslint-underscore-args-ignore-pattern
title: Configure ESLint to ignore _-prefixed parameters project-wide
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [tooling, eslint, testing, conventions]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 lint-cleanup-before-pr
---

## Context

After adding Vitest unit and integration tests for the API handlers, the
`@typescript-eslint/no-unused-vars` rule triggered errors on intentionally
unused stub parameters in test helper functions, e.g.:

```ts
constructor(_key: string) {}           // Stripe mock constructor
end(_body?: string) {}                 // response stub
setHeader(_name: string, _value: string) {}
```

These `_`-prefixed names are a widely recognized TypeScript/JavaScript
convention signalling "I know this parameter exists but I intentionally do
not use it." The convention is used throughout the existing source code for
other purposes (ESLint `varsIgnorePattern` was already in use for
`_`-prefixed variables elsewhere).

## Decision

Extend the `@typescript-eslint/no-unused-vars` rule configuration in
`eslint.config.js` to suppress errors on `_`-prefixed identifiers across
all categories:

```js
'@typescript-eslint/no-unused-vars': ['error', {
  args: 'all',
  argsIgnorePattern: '^_',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  ignoreRestSiblings: true,
}]
```

This replaces the default recommended rule inherited from
`tseslint.configs.recommended`.

## Alternatives considered

- **Per-line `// eslint-disable-next-line` comments** — noisy, requires
  every future test author to know to add them, spreads suppressions
  through test files. Rejected.
- **`_` (bare underscore) only, not `^_` prefix** — too narrow; some
  stubs have meaningful names like `_key` or `_body` that communicate what
  the parameter represents even while being unused.
- **Separate ESLint config override for `**/*.test.*` files only** — more
  targeted, but the `_`-prefix convention is valid and intentional in
  production code too (e.g., catch blocks where the error object is
  unused). A project-wide rule is simpler and consistent.

## Consequences

- **Positive:** Zero ESLint noise from intentional stubs; `npm run lint`
  passes cleanly.
- **Positive:** Test authors can use the established `_`-prefix convention
  without workarounds.
- **Negative:** A genuinely unused parameter that happens to be prefixed
  with `_` by mistake would be silently ignored. Low risk in practice given
  code review.
- **Follow-ups:** The `_`-prefix convention should be mentioned in
  CLAUDE.md's "Code Style Conventions" section so new contributors know it
  is meaningful, not just decorative.

## Notes

CLAUDE.md already documents: "Unused vars: prefix with `_` to silence
ESLint". This ADR makes that statement true at the ESLint configuration
level, not just the variable level.
