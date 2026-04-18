---
id: ADR-2026-04-15-dialog-focus-tabindex-container
title: Focus tabIndex={-1} container on dialog open, not first interactive child
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [a11y, dialogs, focus-management]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 focus-ring-bug-fix
---

## Context

MenuDrawer, ShareSheet, and LoadingOverlay all programmatically called
`.focus()` on the first focusable child element (e.g., the close ×
button) immediately after the dialog opened. This produced a spurious
green/blue focus ring around that element on every dialog open — visible
on fresh page load and on the first one or two opens until the user had
clicked something.

The root cause is a browser heuristic: before any pointer interaction has
occurred on the page, browsers apply `:focus-visible` to **all**
programmatic `.focus()` calls, not just keyboard-triggered ones. After the
first pointer click, subsequent programmatic focus no longer triggers
`:focus-visible`. Once users had clicked the close button, the ring
disappeared, making the bug intermittent and hard to reproduce consistently.

## Decision

Focus a non-interactive container `<div tabIndex={-1}>` instead of the
first focusable child. Browsers intentionally do not show `:focus-visible`
on programmatic focus of non-interactive elements, so the ring never
appears. The container receives `outline-none` (Tailwind) to suppress any
browser default outline. The focus trap and keyboard navigation are
unaffected because interactive children still receive keyboard focus
normally through the trap.

Applied to: `MenuDrawer.tsx`, `ShareSheet.tsx`, `LoadingOverlay.tsx`.

## Alternatives considered

- **`outline: none` / `outline-visible: none` on the close button** —
  removes the ring on that element but also suppresses legitimate
  keyboard-navigation focus rings for users who need them. Bad for a11y.
- **Delay focus with `setTimeout`** — defers the call until after the
  browser registers it as "non-fresh", but this is race-prone and
  unreliable across browsers and frame rates.
- **`preventScroll` option** — not relevant; this is a rendering
  heuristic, not a scroll side-effect.

## Consequences

- **Positive:** No spurious focus rings on any dialog open.
- **Positive:** Legitimate `:focus-visible` rings still work correctly for
  keyboard users navigating within the dialog.
- **Negative:** Every new dialog/sheet component must follow this pattern.
  If a future contributor adds a new modal and focuses its first child
  button, the bug will recur.
- **Follow-ups:** The pattern should be documented in CLAUDE.md under
  "Intentional Patterns" so future contributors know to focus the panel
  container, not the first child.

## Notes

The container div must carry both `tabIndex={-1}` AND `className` including
`outline-none`. Adding `tabIndex={-1}` alone causes the browser to render
its default outline on the container when focused — which showed as a blue
vertical line on the right edge of the MenuDrawer. Both attributes are
required together.
