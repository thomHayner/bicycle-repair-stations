---
id: ADR-2026-04-15-programmatic-move-counter-ref
title: Distinguish user vs programmatic map moves via a ref counter
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [map, leaflet, state]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-search-fab-viewport-overlap-trigger]
source: claude-code-session-2026-04-15 search-fab-triggers
---

## Context

Leaflet fires the same `moveend` event for both user-initiated
movements (drag, pinch, zoom buttons, scroll wheel) and programmatic
animations (`flyTo`, `fitBounds`). The "Search this area" FAB logic
needs to treat these differently: a user drag should check whether
the viewport has moved enough to prompt a re-search, but a
programmatic `flyTo` triggered by toolbar search, GPS recenter, or
selecting a station should reset the "baseline" bounds rather than
triggering the FAB.

There is no built-in Leaflet way to tag an event as programmatic.
The callsite that initiates the animation is the only place with
that information.

## Decision

Maintain a `programmaticMoveRef: MutableRefObject<number>` in
`MapPage.tsx`. Wrap `flyTo` and `fitBounds` in helpers
(`programmaticFlyTo`, `programmaticFitBounds`) that increment the
counter before calling Leaflet. In `MapEventHandler`'s `moveend`
handler:

- If `programmaticMoveRef.current > 0`, decrement and treat as
  programmatic — snapshot the new bounds as the search baseline via
  `onProgrammaticMoveEnd`.
- Otherwise, treat as a user move — run the overlap check.

All programmatic call sites (`handleLocationFound`,
`handleRecenter`, `handleStationSelect`, the initial `flyTo` in
`MapView`, and the auto-radius `fitBounds` effect) go through the
wrappers. The `dragstart` handler resets the counter to 0
defensively, in case a leaked increment is left over (e.g., a
`fitBounds` interrupting a `flyTo` can swallow the expected
`moveend`).

## Alternatives considered

- **Boolean flag `isProgrammaticMove`** — rejected: can't represent
  overlapping animations or nested programmatic moves (e.g.,
  `flyTo` mid-animation followed by `fitBounds` from a parallel
  effect). The counter handles this by reference-counting.
- **One-shot token stored in a ref, consumed by the next `moveend`**
  — considered: simpler than a counter, but same limitation as the
  boolean — if two programmatic moves fire before the first
  `moveend`, the second's token is lost.
- **Detect programmatic moves from `e.target`'s internal animation
  state** — rejected: relies on undocumented Leaflet internals and
  `any`-typed accesses. Fragile across Leaflet versions.

## Consequences

- **Positive:** programmatic animations are reliably distinguished
  without touching Leaflet internals. The pattern is local to
  `MapPage.tsx` / `MapView.tsx` and documented in `CLAUDE.md` so
  future callsites don't call `mapRef.current.flyTo` directly.
- **Negative:** every new programmatic movement callsite must
  remember to use the wrapper. Forgetting to do so causes the FAB
  to mis-trigger on that animation. `CLAUDE.md` flags this as a
  known pattern.
- **Negative:** the `dragstart` counter reset is defensive but
  papers over bugs where the counter would otherwise leak. A leaked
  counter means one user-initiated `moveend` is silently treated as
  programmatic. This is acceptable because the next drag clears it
  and the worst case is "the button shows up one interaction late."
- **Follow-ups:** if more programmatic animation types are added
  (e.g., `panTo`, `setView` with animation), they need wrappers too.

## Notes

The Copilot review on PR #3 flagged two edge cases that shaped the
final implementation:

1. Incrementing the counter before checking `mapRef.current` could
   leak if the map isn't mounted yet — fixed by null-checking the
   ref inside each wrapper before incrementing.
2. A `fitBounds` that interrupts an in-flight `flyTo` can swallow
   the expected `moveend`, leaving the counter permanently elevated
   — handled by the `dragstart` reset, which the next user
   interaction always reaches.

This pattern is called out in `CLAUDE.md` under "Intentional
Patterns — Do Not Flag" so that future AI-assisted sessions don't
try to "simplify" the counter back into a boolean.
