---
id: ADR-2026-04-15-map-json-explicit-plural-suffixes
title: All map.json plural keys use explicit _one/_other suffixes — no bare fallback key
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [i18n, pluralization, schema, map]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 copilot-review-plural-keys
---

## Context

The `map` i18n namespace has two pluralized keys rendered by
`StationListView`:

- `stationCount` — total station count in radius
- `stationCountFiltered` — filtered station count (shown / total)

i18next resolves plural forms by appending suffixes (`_zero`, `_one`,
`_two`, `_few`, `_many`, `_other`) based on the language's plural rules and
the `count` parameter. A key **without** a suffix serves as a fallback for
any form not explicitly provided.

Before this decision, 57 of 97 locales used the bare `stationCountFiltered`
key (no `_one` suffix) alongside `stationCountFiltered_other`. The remaining
30 locales used explicit `stationCountFiltered_one` + `stationCountFiltered_other`.
Four locales (zh, zh-Hant, th, vi — languages with no grammatical plural)
had only `stationCountFiltered_other` with no singular form at all.

The inconsistency was flagged in a CoPilot PR review: mixed conventions
make plural coverage hard to audit and make it easy to miss required forms
for complex-plural languages (e.g., Arabic needs `_zero/_one/_two/_few/_many/_other`).

## Decision

Rename the bare `stationCountFiltered` key to `stationCountFiltered_one` in
all 61 affected locale files. Add `stationCountFiltered_one` (identical
value to `_other`) to the 4 locales that had only `_other`. All 97 locales
now use the explicit suffix scheme.

The convention going forward: every pluralized key in `map.json` must
provide at least `_one` and `_other`. Languages requiring additional forms
(Arabic: 6 forms; Slavic languages: `_few`) provide them explicitly.

## Alternatives considered

- **Keep the bare key as implicit singular fallback** — valid per i18next
  spec (the bare key is a legitimate fallback), but inconsistent with 30
  locales already using explicit suffixes. Hard to grep for coverage gaps.
  Rejected for maintainability.
- **Enforce via ESLint or a custom lint script** — good long-term idea, but
  out of scope for this PR. Noted as a follow-up.

## Consequences

- **Positive:** All 97 locales have a consistent, auditable plural key
  schema. Checking for missing `_one` is a simple grep.
- **Positive:** Future locale files have an unambiguous template to follow.
- **Neutral:** i18next behaviour is identical — the bare key was always
  resolved as the `_one` fallback anyway. No user-visible change.
- **Negative:** 61 locale files had to be rewritten. Any in-flight branch
  that touches `map.json` files will have merge conflicts on
  `stationCountFiltered`.
- **Follow-ups:** Apply the same audit to `stationCount` and any future
  pluralized keys added to `map.json`. Consider a CI check that validates
  all pluralized keys have at least `_one` and `_other` in every locale.

## Notes

Languages with no grammatical plural (Chinese, Japanese, Korean, Thai,
Vietnamese, etc.) use the `_other` form exclusively per i18next's plural
rules. Adding a `_one` key for these languages is harmless — it is never
selected — but makes the schema consistent and avoids special-casing them
in any future validation tooling.
