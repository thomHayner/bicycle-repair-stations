---
id: ADR-2026-04-15-two-tier-cluster-groups
title: Split station markers into two MarkerClusterGroups by radius
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [map, clustering, ux]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-adopt-react-leaflet-cluster, ADR-2026-04-15-in-radius-vs-zoom-marker-styles]
source: claude-code-session-2026-04-15 marker-clustering
---

## Context

We want to show all cached stations on the map, but visually
distinguish ones inside the active search radius from ones outside
it. In-radius stations are the primary content — users care about
them and want counts. Out-of-radius stations are ambient context —
they hint at where more stations exist, but shouldn't compete
visually with the primary set or imply the same level of relevance.

With a single `MarkerClusterGroup`, clusters would merge in-radius
and out-of-radius markers together, flattening the distinction we
want to preserve.

## Decision

Render two independent `MarkerClusterGroup` components in
`MapView.tsx`:

1. **In-radius group** — uses `createClusterIcon` (prominent green,
   shows count), station markers use the large wrench icon.
2. **Out-of-radius group** — uses `createMutedClusterIcon` (small,
   dimmed, no count), station markers use the small dot icon. Only
   rendered when `showMutedMarkers` is true.

Markers never migrate between groups — the split is static per
render, driven by `filteredStationIds`.

## Alternatives considered

- **One cluster group with mixed in-radius and out-of-radius markers**
  — rejected: clusters would merge across tiers, destroying the
  visual separation that motivated the change.
- **One cluster group plus custom `iconCreateFunction` that inspects
  children to decide style** — rejected: more complex, and still
  doesn't solve the "mixed cluster" ambiguity (what count do you
  show? what style wins?).

## Consequences

- **Positive:** clean visual hierarchy. In-radius clusters always
  look prominent; out-of-radius always look ambient. No ambiguity
  about which tier a cluster belongs to.
- **Negative:** a dense in-radius cluster and a dense out-of-radius
  cluster that happen to overlap spatially will render as two
  overlapping icons rather than merging. In practice this is rare
  because the split is radius-based and the two sets are disjoint in
  geography at typical zooms.
- **Follow-ups:** settings for both groups (`maxClusterRadius`,
  `disableClusteringAtZoom`, etc.) must be kept in sync. See
  `ADR-2026-04-15-cluster-interaction-settings`.

## Notes

User explicitly confirmed the tier behavior should be symmetric:
> "the muted cluster markers should behave exactly the same way ad
> the normal cluster markers"

— which is why both groups share identical cluster-interaction
settings even though the visuals differ.
