---
id: ADR-2026-04-15-locale-file-mixed-script-third-party-intentional
title: Mixed-script content in locale files is intentional when referencing third-party fixed strings
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

During automated review of PR #21, GitHub Copilot flagged
`public/locales/hy/reportBug.json` for "corrupted/mixed-script" content:
Latin-script text appearing within an otherwise Armenian (`hy`) locale file,
specifically on lines 24–25. The flag looked like a genuine translation error.

The project owner reviewed the file and confirmed: the Latin-script strings are
**required fixed identifiers** mandated by a third-party system (the GitHub
Issues API). They are field names or labels that the API requires verbatim and
that cannot be translated into Armenian or any other script — they are not
display text.

## Decision

Mixed-script content in `public/locales/**/*.json` files is permitted — and
must not be changed to match the file's primary script — when the string in
question is a fixed identifier, field name, or label required by a third-party
system that the app integrates with. The surrounding locale's script is
irrelevant; the third-party string is invariant.

**Do not "fix" these strings** in response to linter warnings, automated
review flags, or casual review. The presence of Latin text in a non-Latin
locale file is not evidence of an error.

## Alternatives considered

- **Replace with Armenian-script equivalents** — rejected. The strings are not
  display text that can be translated; they are identifiers the GitHub Issues
  API requires in their exact Latin-script form. Replacing them would cause
  API calls to fail.
- **Remove the keys and fall back to English via `fallbackLng`** — rejected.
  The keys are consumed by the UI. Falling back to English would produce
  correct behaviour but would discard the surrounding Armenian context for no
  benefit, and would silently mask the fact that these strings cannot be
  localized.

## Consequences

- **Positive:** Locale files accurately represent what is and is not
  localizable. Contributors can trust that a locale file with mixed script is
  reflecting a real constraint, not a translation oversight.
- **Negative:** Automated tooling — Copilot, future linters, translation
  management platforms — will continue to flag these entries as anomalies.
  Maintainers must recognize the pattern and dismiss the flags.
- **Follow-ups:** JSON does not support inline comments, so the intent cannot
  be expressed in the file itself. Options to document the constraint include:
  (a) a companion `*.meta.json` file per affected locale, (b) a note in
  `CLAUDE.md` under "Intentional Patterns", or (c) a project-level
  `.translation-ignore` convention. None was implemented in this session.

## Notes

- The specific case is `public/locales/hy/reportBug.json` lines 24–25, where
  field names required by the GitHub Issues API appear in Latin script.
- The project owner's response to the Copilot review comment (PR #21,
  comment by `thomHayner`): *"The mixed characters are hard coded English
  language that reference a third party source's requirements. No change is
  necessary."*
- This ADR applies to `reportBug.json` today but the policy covers any locale
  namespace where a third-party integration imposes fixed strings.
