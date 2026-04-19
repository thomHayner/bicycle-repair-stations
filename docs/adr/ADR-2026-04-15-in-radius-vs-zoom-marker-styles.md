---
id: ADR-2026-04-15-in-radius-vs-zoom-marker-styles
title: Choose marker icon by in-radius state, not by zoom level
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [map, markers, ux]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-two-tier-cluster-groups]
source: claude-code-session-2026-04-15 marker-clustering
---

## Context

The previous `StationMarker` chose between two icons based on zoom:

```ts
const icon = zoom >= 14 ? stationIcon : stationDotIcon;
```

When we added the in-radius / out-of-radius distinction (see
`ADR-2026-04-15-two-tier-cluster-groups`), this created a three-way
visual matrix (zoomed-in big, zoomed-out small, plus muted grey for
out-of-radius) that was more states than the UX actually needed to
communicate.

## Decision

Drop the zoom-based icon switch. `StationMarker` now picks its icon
purely from the `isInRadius` prop:

```ts
const icon = isInRadius ? stationIcon : stationDotIcon;
```

In-radius stations always render the large wrench icon. Out-of-radius
stations always render the small dot icon. Zoom level no longer
affects marker appearance.

## Alternatives considered

- **Keep zoom-based switch and add muted grey as a third state** —
  considered and rejected in conversation. User's prompt:
  > "what if we ignore the old zoom level = small dots and just go
  > with small and big? that would eliminate the third grey option
  > and still differentiate between in radius and out of radius,
  > correct?"
  The simpler two-state model was preferred.

## Consequences

- **Positive:** simpler mental model — one icon per relevance tier,
  regardless of zoom. Works naturally with the two cluster groups.
- **Negative:** at low zoom, in-radius stations show the full-size
  wrench icon, which can feel visually heavy compared to the old
  "zoomed-out = dots" behavior. Clustering mitigates this: at low
  zoom the large icons get absorbed into cluster bubbles.

## Notes

This was discussed as part of the broader clustering redesign, not
as a standalone change. The old `zoom` state and `visibleWidthMiles`
import were removed from `MapView.tsx` as dead code during the same
pass.
