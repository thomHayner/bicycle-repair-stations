---
id: ADR-2026-04-15-two-marker-gps-vs-search-visibility
title: Define explicit visibility rules for UserMarker and SearchLocationMarker
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [frontend, markers, geolocation, ux]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 marker-and-auto-radius-overhaul
---

## Context

The map uses two marker types with distinct purposes: **UserMarker** (pulsing blue
dot — "you are here") and **SearchLocationMarker** (dark teardrop pin — "searching
here"). Before this session the rules governing their visibility were inconsistent:

- `userPosition` was derived from `geo.status === "resolved" || geo.status ===
  "denied"`, so the blue dot appeared even when geolocation was denied and the
  coordinates were a hardcoded fallback (London). This implied a confirmed GPS fix
  where none existed.
- When geolocation was denied, `searchedLocation` was never set, so no visual anchor
  was shown for the fallback search area — the user saw neither the blue dot (wrong)
  nor a search pin (confusing).
- `searchedLocation` was set unconditionally on every typed search and "Search this
  area" click, including cases where the user searched a spot less than a mile from
  their GPS position — a redundant pin on top of the blue dot.

A dedicated `handleRecenter` pathway (with its own `onRecenter` prop on `Toolbar`)
was also needed so that pressing "Locate me" could clear the search pin rather than
routing through `handleLocationFound` and re-setting it.

## Decision

`userPosition` is derived only from `geo.status === "resolved"`. UserMarker never
appears unless the browser confirmed an actual GPS fix.

The geo-latch `useEffect` now also fires on `geo.status === "denied"`, setting
`givenLocation` to the fallback coordinates **and** setting `searchedLocation` to
the same coordinates so SearchLocationMarker renders there. When geo resolves
normally, `searchedLocation` remains null (the blue dot already marks the spot).

`handleLocationFound` and `handleSearchHere` both suppress the search pin when the
new search location is within 1 mile of `userPosition` (i.e. when the user searches
near themselves).

`handleRecenter` sets `searchedLocation` to null explicitly; pressing "Locate me"
removes the search pin and leaves only the blue dot.

## Alternatives considered

- **Show blue dot at fallback when denied** — rejected. The fallback is not the
  user's location; showing the GPS marker there is actively misleading.
- **Show no marker at all when denied** — rejected. The user would see stations
  loaded for an area with no visual indication of where the search is anchored.
- **Always show search pin on explicit search regardless of proximity to GPS** —
  rejected. A redundant pin 0.3 miles from the blue dot clutters the map without
  adding information.

## Consequences

- **Positive:**
  - Each marker has exactly one meaning; no marker ever lies about GPS status.
  - Users who deny location see a clear "searching here" pin at the fallback city.
  - Users who search near their GPS position see a clean map with only the blue dot.
- **Negative:**
  - `Toolbar` now has two callbacks (`onLocationFound`, `onRecenter`) where it
    previously had one. Any future caller of `Toolbar` must supply both.
  - The 1-mile suppression threshold is a fixed constant, not configurable. If it
    turns out to be wrong, changing it requires a code edit.
- **Follow-ups:**
  - The fallback location is currently London (hardcoded). A planned improvement is
    to use IP geolocation to determine the user's country and centre on its capital.
    When that lands, the denied-path `searchedLocation` will follow automatically.
  - Consider surfacing a tooltip on the search pin ("Tap to search nearby") for
    users who land on the denied path.

## Notes

- All logic lives in `src/pages/MapPage.tsx`.
- `onRecenter` prop is defined in `src/components/Toolbar/Toolbar.tsx`.
- The 1-mile suppression check reuses `haversineDistanceMiles` from
  `src/lib/distance.ts`.
