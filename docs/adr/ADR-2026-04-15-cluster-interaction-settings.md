---
id: ADR-2026-04-15-cluster-interaction-settings
title: Disable spiderfy; stop clustering at zoom 16
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [map, clustering, mobile, ux]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-adopt-react-leaflet-cluster, ADR-2026-04-15-two-tier-cluster-groups]
source: claude-code-session-2026-04-15 marker-clustering
---

## Context

After adopting `react-leaflet-cluster`, we hit two interaction
issues:

1. On mobile, tapping a cluster of very close stations would
   spiderfy briefly and then collapse back into the cluster before
   the user could tap a leg. The user's description:
   > "i click on the cluster marker, it spiderifies and then
   > immediately collapses back into its cluster."
2. Needed to pick zoom thresholds: at what zoom should clustering
   stop, and how aggressive should the clustering radius be.

An earlier attempt added a custom `clusterclick` handler to
programmatically manage spiderfy on mobile. The user discarded it:
> "That did not work and I discarded most of your changes. I kept
> just the `spiderfyOnMaxZoom={false}`. It seems to be working."

## Decision

Configure both `MarkerClusterGroup` instances identically with:

```tsx
maxClusterRadius={60}
disableClusteringAtZoom={16}
spiderfyOnMaxZoom={false}
showCoverageOnHover={false}
animate={true}
chunkedLoading={true}
zoomToBoundsOnClick={true}
```

Additionally, when a station is selected programmatically (e.g. from
the list sheet), `flyTo` uses zoom 17 — one level past
`disableClusteringAtZoom` — to guarantee the target marker is never
inside a cluster when we try to open its popup.

## Alternatives considered

- **Custom `clusterclick` handler for mobile** — tried, discarded by
  user; the simpler `spiderfyOnMaxZoom={false}` alone was sufficient.
- **Higher `disableClusteringAtZoom` (e.g. 17 or 18)** — rejected:
  would leave too many stations clustered at typical user zoom and
  defeat the purpose at close range.
- **Enable `showCoverageOnHover`** — rejected: noisy, not useful on
  touch devices.

## Consequences

- **Positive:** simple, declarative config. Works on both mobile and
  desktop without custom event handling. In-radius and out-of-radius
  tiers behave identically, matching user expectation.
- **Negative:** `spiderfyOnMaxZoom={false}` means genuinely
  co-located stations at z16+ will still overlap visually; users
  must zoom past z16 to separate them. Acceptable because
  `flyTo(..., 17)` is used whenever we programmatically focus a
  station, and `zoomToBoundsOnClick` handles most manual exploration.
- **Follow-ups:** if usage shows too many stations overlap at z16+
  even after zoom, revisit spiderfy with a different approach.

## Notes

`flyTo` zoom 17 is coupled to `disableClusteringAtZoom={16}`. If
either is changed, the other should be reconsidered — raising
`disableClusteringAtZoom` past 17 would put the flyTo target back
inside a cluster and re-break the popup-open flow described in
`ADR-2026-04-15-popup-opens-after-flyto`.
