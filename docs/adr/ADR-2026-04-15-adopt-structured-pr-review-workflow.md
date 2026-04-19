---
id: ADR-2026-04-15-adopt-structured-pr-review-workflow
title: Adopt per-PR-type Claude Code slash commands with a shared review base
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [workflow, tooling, pr-review]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 pr review slash commands and template
---

## Context

The repo had a 7-item PR checklist in `.github/pull_request_template.md`
(build, dark/light mode, mobile viewport, a11y contrast, ARIA
semantics, dialog keyboard, axe scan). The author wanted to expand
coverage to reflect actual project standards — a11y, MD3 compliance,
i18n readiness (for upcoming localisation work), React data flow
patterns (useCallback / useMemo / Context / caching), dark mode,
linting, build, docs/README — and to be able to invoke these checks
as a prompt at the end of any Claude Code session, tailored to the
type of change (feature, refactor, bugfix, chore, docs, CRUD).

## Decision

Created six PR-type slash commands in `.claude/commands/`
(`pr-feature.md`, `pr-refactor.md`, `pr-bugfix.md`, `pr-chore.md`,
`pr-docs.md`, `pr-crud.md`), each of which tells Claude to first
read and execute a shared `_base-review.md` checklist and then run
type-specific checks on top. Commands that don't need all base
checks (chore, docs) explicitly list which base sections to SKIP.
Every command ends with the same instruction to produce a
PASS / FAIL / SKIP / WARN summary table with file paths and line
numbers. The PR template in `.github/pull_request_template.md` was
rewritten to mirror the same category structure (Build & Lint,
Accessibility, Dialog & Keyboard, Dark Mode, i18n Readiness, MD3
Compliance, Data Flow, Responsive, Docs) so the slash-command
output maps directly onto the template checkboxes.

## Alternatives considered

- **Fully self-contained commands per PR type** — rejected because
  ~25 checks are common across most PR types; duplicating them in
  six files would drift whenever a rule is added.
- **Single generic `/pr-review` command** — rejected because the
  checks meaningfully differ by PR type (a docs-only change
  doesn't need dark-mode testing; a chore PR rarely touches MD3).
- **Only update the PR template, no slash commands** — rejected
  because the author wanted an invokable end-of-session prompt,
  not just a manual checklist.
- **Shared base as a non-command include** — not available in
  Claude Code; files in `.claude/commands/` are all exposed as
  slash commands. Signalled intent with the `_` prefix instead.

## Consequences

- **Positive:** consistent review structure across PR types; slash
  commands and the PR template share vocabulary so reviewers and
  contributors see the same categories in both places; per-type
  skipping keeps the checklist relevant.
- **Negative:** standards changes must be kept in sync in two
  places (`_base-review.md` and the PR template); `_base-review.md`
  is exposed as a slash command despite being intended as an include.
- **Follow-ups:** "Test Plan" workflows are the next topic after this
  one (flagged by the author). May want to revisit which checks
  apply once the i18n library lands and the actual translation
  workflow is in place.

## Notes

- Check coverage matrix (Y = runs, skip = not run) by PR type was
  recorded in the author's local Claude plan file and was not
  committed to the repository.
- Directory was created at
  `.claude/commands/` alongside the pre-existing `dev-start.sh` and
  `launch.json`; those files were not touched.
- The "Search this area" zoom-out behaviour was discussed later in
  the same session but not decided or implemented — no ADR for it.
