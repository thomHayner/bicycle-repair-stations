---
id: ADR-2026-04-15-partial-locale-schema-recovery-strategy
title: Recover wrong-schema locale files by preserving matching translations and using English for the rest
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [i18n, locales, content]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 i18n language-support PR review
---

## Context

During PR review of the i18n feature branch, 15 locale `share.json` files were
discovered to have been generated against an old namespace schema that no
longer matched what `ShareSheet.tsx` consumes.

**Old schema (10 keys):** `shareApp`, `shareStation`, `shareAppMessage`,
`shareStationMessage`, `copyLink`, `linkCopied`, `email`, `emailSubjectApp`,
`emailSubjectStation`, `shareVia`

**Correct schema (9 keys):** `title`, `subtitle`, `nativeShare`, `shareOnX`,
`shareOnFacebook`, `shareByEmail`, `copyLink`, `linkCopied`, `copyFailed`

Two keys — `copyLink` and `linkCopied` — existed in both schemas with correct
native translations. The remaining seven old-schema keys were never read by the
UI; the remaining seven correct-schema keys were silently falling back to
English via `i18next`'s `fallbackLng: "en"`.

**Affected locales:** af am bn ca ha hi is ku ky so sw ti tk yo zh-Hant

## Decision

Rewrite the 15 affected files to the correct schema:

1. **Keep** any key-value pairs whose keys appear in the correct schema
   (`copyLink`, `linkCopied` — confirmed correct translations).
2. **Populate remaining correct-schema keys** with the English string values
   from `en/share.json`. This makes the translation debt visible in the files
   themselves rather than hiding it behind `fallbackLng` silence.
3. **Discard** all old-schema keys (`shareApp`, `shareStation`, etc.) — they
   are never consumed by the UI.

## Alternatives considered

- **Full retranslation in the session** — rejected. 15 languages × 7 missing
  keys was out of scope; the correct translations do not exist anywhere in the
  repo. The blocked-on-translation debt is better made explicit (English
  strings in the file) than papered over.
- **Delete the files entirely** — rejected. Deletion would lose the confirmed,
  correct `copyLink` and `linkCopied` translations. `i18next` would fall back
  to English for those keys too, silently discarding known-good work.
- **Leave wrong-schema files in place** — rejected. The old keys are never
  read, so the UI already falls back to English for `title`, `subtitle`, etc.
  However, the mismatch is invisible: no error, no log, no indication that
  translations are missing. Making the English strings explicit in the files
  creates a visible signal for future translation work.

## Consequences

- **Positive:** The UI renders correctly for all 15 affected locales.
  Confirmed translations for `copyLink` and `linkCopied` are preserved.
- **Positive:** The 7 untranslated keys are now explicit English strings in
  the locale files, making the translation gap discoverable by anyone reading
  the files or running a translation-coverage tool.
- **Negative:** Users of the 15 affected locales see English for `title`,
  `subtitle`, `nativeShare`, `shareOnX`, `shareOnFacebook`, `shareByEmail`,
  and `copyFailed` in the Share sheet.
- **Follow-ups:** Each of the 15 locales needs proper translations for those
  7 keys. The presence of English strings in non-English locale files is the
  signal to track this debt.

## Notes

- The schema mismatch originated because an early iteration of the `share`
  namespace used different key names before `ShareSheet.tsx` was finalised.
  Locale files generated during that early iteration were never updated.
- The same divergence could recur if the UI schema changes in the future while
  locale files are not regenerated simultaneously. This ADR establishes the
  recovery procedure: preserve matching translations, use English for the rest,
  discard stale keys.
- The fix was applied via a Python script that read the old file, extracted
  matching keys, and wrote a new file with the correct schema.
