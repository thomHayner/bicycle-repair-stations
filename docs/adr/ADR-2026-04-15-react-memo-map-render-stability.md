---
id: ADR-2026-04-15-react-memo-map-render-stability
title: Wrap map components in React.memo with a strict prop-stability contract
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, map, performance]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-memoize-eventhandlers-popup-stability]
source: claude-code-session-2026-04-15 memoization popup flash fix
---

## Context

`MapPage` re-renders on every `moveend` event (map pan/zoom calls
`setMapCenter`). Without any memoization, this caused every child component
to re-render on every map interaction — including all `StationMarker`
instances (one per station), `MapView`, and `StationListView`. On a map with
50+ stations this is significant work on the render thread, and it was also
the propagation path for the popup-flash bug (see related ADR).

Several values were also recreating object/array identity on every render,
making future `React.memo` usage ineffective before those were fixed:

- `userPosition` — inline object `{ lat, lng, accuracy }` rebuilt every render
- `filteredStations` — `.filter()` result, new array every render
- `handleStationSelect`, `handleStationDeselect`, `handleMoveEnd`,
  `handleMapInteraction` — plain arrow functions, new references every render

## Decision

Adopt `React.memo` on `StationMarker` and `MapView`, and establish a
prop-stability contract enforced at the `MapPage` level:

1. **`StationMarker`** — wrapped in `memo()`. Renders once per station;
   skips re-render unless `station`, `isSelected`, `isInRadius`,
   `onSelect`, `onDeselect`, or `userDistances` actually change.
2. **`MapView`** — wrapped in `memo()`. Skips re-render when unrelated
   MapPage state changes (e.g. `errorDismissed`, `isFetchingStations`).
3. **`userPosition`** — memoized via `useMemo` keyed on extracted primitives
   (`geoLat`, `geoLng`, `geoAcc`) so its object identity is stable between
   GPS ticks that return the same coordinates.
4. **`filteredStations`** — memoized via `useMemo` keyed on
   `[allStations, filterCenter?.lat, filterCenter?.lng, displayMiles]`.
5. **Key handlers** — `handleStationSelect`, `handleStationDeselect`,
   `handleMoveEnd`, `handleMapInteraction` wrapped in `useCallback` so they
   are stable across MapPage renders.

## Alternatives considered

- **No memoization (status quo)** — simple but causes all markers to re-render
  on every map pan, and was the root environment for the popup flash bug.
  Rejected on performance grounds.
- **Move map state into a store (Zustand/Context)** — would decouple map
  children from MapPage's render cycle entirely. More surgical but also a
  significantly larger refactor. Not discussed as a near-term option.
- **Custom memo comparator** — pass a `propsAreEqual` function to `memo()`
  for `MapView` or `StationMarker`. Rejected as unnecessary complexity; the
  default shallow comparison is sufficient once props are stabilized at source.

## Consequences

- **Positive:** `StationMarker` instances no longer re-render on map pan.
  `MapView` no longer re-renders on unrelated MapPage state changes. `userDistances`
  (a `Map<number, number>`) retains its reference across renders where
  position and stations are unchanged, preventing downstream busting.
- **Negative:** The prop-stability contract is implicit. Any future caller
  that passes a new object/function reference to `StationMarker` or `MapView`
  on every render will silently break the memo without a type error or
  warning. This is a maintenance hazard.
- **Negative:** `useCallback` and `useMemo` add overhead (dependency array
  allocation and comparison) on every render. At the scale of this app the
  tradeoff clearly favours memoization, but it is not free.
- **Follow-ups:** `StationListView` was identified as another candidate for
  `React.memo` + memoized `sorted`/`filtered` arrays. Not implemented in this
  session; deferred.

## Notes

`allStations` identity is stable — `useStationQuery` returns the same array
reference until a new Overpass fetch completes, so `filteredStations` memo
does not bust on normal map interactions.

`mapRef` is a React ref (stable by definition) so `useCallback` deps that
include it do not cause spurious re-creation.
