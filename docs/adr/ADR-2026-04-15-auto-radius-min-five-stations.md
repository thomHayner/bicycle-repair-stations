---
id: ADR-2026-04-15-auto-radius-min-five-stations
title: Auto-select the distance filter to show at least 5 stations on each new location
status: superseded
date: 2026-04-15
deciders: [tom]
tags: [frontend, ux, filtering, map]
supersedes: []
superseded_by: [ADR-2026-04-15-search-display-radius-revamp]
related: []
source: claude-code-session-2026-04-15 marker-and-auto-radius-overhaul
---

> **Superseded — retained for history.**
> Current code in `src/pages/MapPage.tsx` uses a **≥ 1 station**
> threshold (not ≥ 5), starts from the 2-mi / 5-km default (not 1 mi),
> and no longer reacts to zoom or escalates to a 250-mi fallback. See
> [`ADR-2026-04-15-search-display-radius-revamp`](ADR-2026-04-15-search-display-radius-revamp.md)
> for the active decision.

## Context

`selectedDist` (the radius filter shown in StationListView) defaulted to 1 mile and
never changed automatically unless the user manually clicked a pill or zoomed out far
enough to trigger `handleVisibleWidthChange`. In a dense city the 1-mile default is
fine; in a small town or rural area users frequently landed on "No stations within
1 mi" with no guidance that stations exist at a larger radius.

The existing `handleVisibleWidthChange` logic increases the radius when the user
zooms out — but it reacts to viewport width, not station count, and it only fires
after a user interaction. It gives no help on initial load.

The desired behaviour: on every new `givenLocation` (initial load, typed search,
"Search this area"), automatically pick the smallest preset that yields ≥ 5 stations,
zoom the map to show that circle, and then leave the user in control.

## Decision

A `useEffect` in `MapPage` fires once per unique `givenLocation` value (guarded by
`autoRadiusLocationRef`) after `query.status === "success"`. It iterates the ordered
preset array for the active unit (`MI_OPTIONS = [1, 2, 5, 10, 15, 20, 25]` or
`KM_OPTIONS`) and selects the first option for which ≥ 5 stations fall within that
radius. If no option satisfies the threshold, it selects the maximum (25 mi / 40 km).
It then calls `mapRef.current.fitBounds()` with a bounding box derived from the
chosen radius, padding 40 px, capped at zoom 16.

If stations cannot be found even at the maximum preset, `useStationQuery` escalates
to its existing 250-mile wide-area search; that path has its own `selectedDist` sync
via the `fallbackFarthestMiRef` effect and is not touched by this logic.

## Alternatives considered

- **Always default to 1 mile and let the user expand manually** — rejected. First-
  time users in sparse areas see an empty list with no affordance to expand; the
  empty state is confusing and requires discovery of the radius pills.
- **Rely solely on `handleVisibleWidthChange` (zoom-out triggered expansion)** —
  rejected. That responds to zoom level, not station count. A user at zoom 13 in a
  sparse area would still see an empty list; only zooming out further would help,
  which isn't intuitive.
- **Immediately jump to the largest radius that has any stations** — rejected.
  Showing "42 stations within 25 mi" for a user who has 6 stations within 2 mi
  over-expands the view for no benefit.
- **Use 1 station as the threshold** — considered and rejected in favour of 5,
  because 1–4 stations is still a sparse result that suggests the user should see
  more context.

## Consequences

- **Positive:**
  - Users in any density area see a non-empty station list and an appropriately
    zoomed map without any manual interaction.
  - Mechanism is transparent — the selected pill visibly changes, so users can see
    what happened and override it immediately.
  - The ref guard (`autoRadiusLocationRef`) ensures the auto-selection never
    overrides a manual pill choice mid-session for the same location.
- **Negative:**
  - The `fitBounds` call on load may fight with the `flyTo` that `MapView` fires when
    `userPosition` first resolves. Ordering depends on React render timing; in
    practice `query.status` becomes `"success"` after the geo fly completes, so
    conflict has not been observed. This is a latent fragility.
  - The ≥ 5 threshold and preset steps are hardcoded. If `MI_OPTIONS` or `KM_OPTIONS`
    change, this logic inherits the change automatically — which is correct but
    implicit.
  - `fitBounds` uses a rectangular bounding box approximation of the circle, not the
    actual circle. For large radii near the poles the approximation degrades, but
    the app's use case (urban bicycle infrastructure) makes this irrelevant in
    practice.
- **Follow-ups:**
  - Monitor whether the `fitBounds` / `flyTo` ordering ever produces a visual glitch
    on fast devices where geo resolves quickly.
  - Consider whether the threshold (5) should be configurable per unit or per region.

## Notes

- Effect and ref live in `src/pages/MapPage.tsx` immediately after the wide-area
  `farthestMi` sync effect.
- Reuses `haversineDistanceMiles` (`src/lib/distance.ts`), `MI_OPTIONS`,
  `KM_OPTIONS`, `KM_PER_MILE` (`src/lib/units.ts`).
- The bounding box formula: `latDelta = distMiles / 69`,
  `lngDelta = latDelta / cos(lat * π/180)`.
