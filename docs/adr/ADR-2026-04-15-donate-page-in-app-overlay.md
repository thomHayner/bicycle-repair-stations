---
id: ADR-2026-04-15-donate-page-in-app-overlay
title: Build donate page as an in-app overlay with amount-selection UI
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, routing, ux]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 donate page
---

## Context

The project needed a way for users to financially support the developer
to help cover hosting and development costs. The menu already had an
established pattern for external links (e.g. "Add a missing station" →
`openstreetmap.org/edit`) and an established pattern for internal overlay
pages (About, Guides).

The question was whether a donate entry should be a plain external link
that navigates directly to a third-party service, or an in-app page that
owns the amount-selection step before handing off to a processor.

## Decision

We built a full-screen route-based overlay page at `/donate`, following
the same fixed-inset-0 pattern as `AboutPage` and `GuidesPage`. The page
owns the UX for selecting a donation amount (preset pills: $1, $2, $5;
plus a whole-dollar custom input, $1–$100, defaulting to $10). The donate
button is currently disabled with a `// TODO` comment because the payment
processor (Buy Me a Coffee, Ko-fi, Patreon, etc.) had not been chosen at
the time of writing. The selected amount is ready to be passed as a URL
parameter when a processor is integrated.

## Alternatives considered

- **Plain external link in `EXTERNAL_ITEMS`** — simplest path; no
  in-app page needed. Rejected because it gives up control of the
  amount-selection step; most donation platforms support a pre-filled
  amount via URL, so capturing the amount first produces a better UX
  and makes the eventual processor integration more flexible.

- **Modal dialog over the map** — would avoid adding a new route.
  Rejected implicitly by following the existing page pattern; the
  project already uses full-screen overlays for all secondary pages,
  and a modal would be an inconsistency without a clear benefit.

## Consequences

- **Positive:** Amount selection is decoupled from the specific
  processor. When a processor is chosen, only the `onClick` handler
  needs updating — the rest of the page is already built and styled.
- **Positive:** Consistent UX with About and Guides pages (same
  overlay pattern, back navigation, dark mode support).
- **Negative:** The page currently has a dead (disabled) CTA, which
  could confuse users if the page is discoverable before a processor
  is wired in. The "coming soon" copy beneath the button mitigates
  this.
- **Follow-ups:** Once a payment processor is chosen, update the
  `onClick` in `src/pages/DonatePage.tsx` to construct the processor's
  URL with the selected amount and call `window.open(url, "_blank")`.
  Remove the `disabled` prop and the "coming soon" note at that point.

## Notes

The donate link was added to `INFO_ITEMS` in `MenuDrawer.tsx` (not
`NAV_ITEMS`), grouping it with "About" as a meta/support entry rather
than a primary feature.

Component: `src/pages/DonatePage.tsx`
Route: `/donate` (lazy-loaded, same `<Suspense>` wrapper as other pages)
Menu entry: `src/components/Menu/MenuDrawer.tsx` — `INFO_ITEMS`
