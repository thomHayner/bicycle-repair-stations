---
id: ADR-2026-04-15-loading-overlay-conditional-dialog-role
title: Use conditional ARIA role (dialog vs status) in LoadingOverlay based on interactive content
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [a11y, dialogs, i18n]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-dialog-focus-tabindex-container]
source: claude-code-session-2026-04-15 i18n language-support PR review
---

## Context

`LoadingOverlay` was originally a pure spinner with `role="status"
aria-live="polite"` — the correct semantics for a non-interactive status
announcement. The i18n feature (PR #21) added a first-visit language-choice
prompt to the same component: two buttons ("English" / native language name)
that the user must interact with before the app proceeds.

Buttons inside a `role="status"` container have no focus trap, no Escape
handler, and screen readers do not treat the container as a dialog. A keyboard
or AT user would have no guaranteed way to reach or dismiss the prompt.

## Decision

Use conditional ARIA semantics driven by an `isDialog` boolean
(`!!(suggestedLocale && onLocaleChosen)`):

- **Dialog mode** (`isDialog = true`): `role="dialog"`, `aria-modal={true}`,
  `aria-labelledby="lang-prompt-title"`, `tabIndex={-1}` on the container div,
  `outline-none` class, focus trap via `document.addEventListener("keydown")`,
  and Escape → `onLocaleChosen("en")` (dismiss as English choice).
- **Status mode** (`isDialog = false`): `role="status"`, `aria-live="polite"`,
  `aria-atomic={true}` — unchanged from the original spinner behaviour.

Both modes share the same component, the same full-screen fixed positioning,
the logo block, and the surface styling. The `panelRef` is attached to the
outer container and `.focus()` is called on it directly (consistent with
`ADR-2026-04-15-dialog-focus-tabindex-container`; `tabIndex={-1}` is required
for this to work in dialog mode).

## Alternatives considered

- **Two separate components (`SpinnerOverlay` + `LanguagePromptDialog`)** —
  rejected. They share substantial structure: fixed inset-0 positioning, the
  wrench-logo block, background colour, and z-index. Splitting would duplicate
  ~60 lines of JSX with no behavioural gain. The `isDialog` flag cleanly
  separates the two modes at the prop boundary.
- **Always `role="dialog"`** — rejected. The spinner is a status announcement,
  not an interactive dialog. Applying dialog semantics to a non-interactive
  element causes some screen readers to interrupt the current reading context
  unnecessarily and sets an incorrect expectation of user interaction.
- **Keep `role="status"` with interactive buttons** — rejected. No focus trap
  is possible on a status region; keyboard users cannot reliably navigate to or
  dismiss the prompt.

## Consequences

- **Positive:** Both use cases — spinner and language prompt — are handled
  correctly by assistive technology.
- **Positive:** Escape-to-dismiss maps naturally to "keep English", which is a
  sensible default action for users who trigger it accidentally.
- **Negative:** A single component now has two distinct behavioural modes.
  Future contributors must test both: rendering without `suggestedLocale`
  (status mode) and with it (dialog mode).
- **Follow-ups:** If the overlay ever gains a third distinct mode (e.g.,
  an update-available prompt with multiple choices), consider splitting into
  separate components rather than adding a third branch.

## Notes

- `tabIndex={-1}` and `outline-none` are applied only in dialog mode; the
  status-mode container does not receive them (consistent with the existing
  pattern — a `role="status"` div doesn't need keyboard focusability).
- The `id="lang-prompt-title"` attribute is placed on the `<h1>` (app name)
  only in dialog mode, so `aria-labelledby` points to a real element.
- `"English"` is hardcoded in the prompt button because the baseline language
  in a language picker must always display in English regardless of the
  currently detected locale.
