---
id: ADR-2026-04-15-memoize-eventhandlers-popup-stability
title: Memoize react-leaflet eventHandlers to prevent popup flash
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, map, performance]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-react-memo-map-render-stability]
source: claude-code-session-2026-04-15 memoization popup flash fix
---

## Context

On mobile, the station popup was visibly flashing — closing and reopening
rapidly whenever the map was panned or any MapPage state changed. The root
cause was traced to `StationMarker.tsx`: the `eventHandlers` prop passed to
react-leaflet's `<Marker>` was an inline object literal, creating a new
reference on every render.

react-leaflet's `useEventHandlers` hook diffs `eventHandlers` by reference.
When it detects a new object it calls `layer.off()` to remove all previous
listeners and `layer.on()` to re-register them. Leaflet's internal `off()`
path closes any open popup bound to that layer as a side effect of the
listener teardown cycle. Because MapPage re-renders on every `moveend` event
(to update `mapCenter`), the popup was being closed on every map drag.

## Decision

Wrap the `eventHandlers` object in `useMemo` inside `StationMarker`, keyed on
`[onDeselect, onSelect, station]`. This gives the object a stable identity
across renders so react-leaflet never triggers listener teardown unless the
actual handlers or station change.

```tsx
const eventHandlers = useMemo(() => ({
  popupclose: () => {
    if ((markerRef.current as any)?._map) onDeselect();
  },
  click: () => onSelect(station),
}), [onDeselect, onSelect, station]);
```

## Alternatives considered

- **Attach Leaflet events directly in `useEffect`** — avoids react-leaflet's
  diffing entirely, but requires manual cleanup, is harder to reason about,
  and departs from the established react-leaflet usage pattern in this file.
  Rejected as higher complexity for the same outcome.
- **Suppress the popup close on `layer.off()`** — would require patching or
  monkey-patching Leaflet internals. Not considered viable.
- **Restructure so the popup is not managed by the Marker at all** — move
  popup state up to MapView and render it in a portal. Larger refactor;
  deferred, not rejected in principle.

## Consequences

- **Positive:** Popup no longer flashes on map pan. The fix is localised to
  `StationMarker` and does not require changes elsewhere.
- **Negative:** `onDeselect` and `onSelect` must be stable (i.e., wrapped in
  `useCallback` at call sites) for the memo to hold. If a caller passes a
  new function reference on every render, `eventHandlers` busts and the popup
  flash returns. This constraint is enforced implicitly — there is no compile-
  time guard.
- **Follow-ups:** Consider adding a lint rule or code comment on the Props
  interface to document the stability requirement for `onSelect`/`onDeselect`.

## Notes

`station` identity is stable in practice: the same `OverpassNode` object
reference is returned by `useStationQuery` until a new Overpass fetch
completes, so it does not bust the memo on ordinary map interactions.
