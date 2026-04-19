---
id: ADR-2026-04-15-popup-opens-after-flyto
title: Open station popups only after the flyTo animation settles
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [map, popup, ux, leaflet]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-adopt-react-leaflet-cluster]
source: claude-code-session-2026-04-15 marker-clustering
---

## Context

When a user taps a station marker, we want to fly to it and then
show its popup. Leaflet's default `Marker` behavior is to open the
bound popup immediately on click. Combined with our `flyTo` call,
this caused the popup to open at the old center, then close
mid-animation as the map moved — an obvious visual bug. User
feedback:

> "at the end of the animation it closes the marker popup... Instead,
> it should treat that station as an individual marker that is to be
> zoomed and centered on, and the popup should be open after the map
> animation is finished."

An additional wrinkle: markers inside a cluster have no `_map`
reference (Leaflet detaches clustered children from the map), so
calling `.openPopup()` on them is a no-op and `popupclose` can fire
spuriously during clustering/unclustering transitions.

## Decision

Split popup control from Leaflet's default click handler:

1. **Unbind default auto-popup** on mount in `StationMarker`:
   `marker.off('click', (marker as any)._openPopup, marker)`.
2. **`onSelect` callback** — the marker's `click` handler calls
   `onSelect(station)`, which in `MapPage` sets
   `selectedStationId` and triggers `flyTo([lat, lon], 17, { duration: 0.8 })`.
3. **`isSelected` + `moveend`** — `StationMarker` watches its
   `isSelected` prop and, when it becomes true, registers a one-shot
   `map.once("moveend", ...)` that calls `marker.openPopup()` after
   the animation settles.
4. **Guard against clustered markers** — both the popup open and the
   `popupclose → onDeselect` handler check `(marker as any)._map` to
   avoid acting on detached / clustered markers.

## Alternatives considered

- **Use `map.setView()` without animation** — rejected: the flyTo
  animation is a deliberate UX feature, not incidental.
- **Open the popup first, then flyTo** — rejected: this is what
  Leaflet already does by default, and it's what caused the bug.
- **Delay popup open with a fixed `setTimeout`** — rejected:
  animation duration can vary and `moveend` is the authoritative
  signal.

## Consequences

- **Positive:** popup reliably opens after the map settles, at the
  correct position, with the animation intact. Works identically for
  list-selected stations and marker-tapped stations (both go through
  `onSelect`).
- **Negative:** requires threading `selectedStationId` and
  `isSelected` through `MapPage` → `MapView` → `StationMarker`.
  Depends on Leaflet internals (`_map`, `_openPopup`) which have no
  typed public API — each access is wrapped in an
  `eslint-disable-next-line @typescript-eslint/no-explicit-any` with
  an explanatory comment (already documented as an intentional
  pattern in `CLAUDE.md`).
- **Follow-ups:** if Leaflet ever exposes a public `rebind` or
  `openPopupAfter` API, the `_openPopup` off-switch could be cleaned
  up.

## Notes

The `_map` guard in the `popupclose` handler also prevents an
unintended `onDeselect` from firing when a marker is re-clustered
under the user (e.g., after a zoom-out), which would otherwise drop
the selection state.
