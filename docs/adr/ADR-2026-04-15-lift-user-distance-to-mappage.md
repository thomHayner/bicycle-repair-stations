---
id: ADR-2026-04-15-lift-user-distance-to-mappage
title: Compute GPS-to-station distances once in MapPage, share via Map lookup
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [frontend, performance, data-flow]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-distance-display-from-gps-only]
source: claude-code-session-2026-04-15 marker distance and directions
---

## Context

Station-to-user distance (haversine) was being computed inside two separate
child components: `StationListView` (once per visible list card on every
render) and `StationPopup` (once per open popup). When a popup was open,
the selected station's distance was being calculated twice simultaneously —
once in the list loop and once inside the popup's render. The issue was
surfaced during review of the initial distance-display implementation and
prompted a deliberate lift.

## Decision

Compute `haversineDistanceMiles(userPosition → station)` exactly once per
station per render cycle in `MapPage`, keyed into a `Map<stationId, number>`
named `userDistances`. Pass that map as a prop to `StationListView` (list
cards look up by `station.id`) and through `MapView → StationMarker →
StationPopup` (popup receives the pre-looked-up `distMi: number | null`
scalar). Neither child imports or calls `haversineDistanceMiles` for the
user-distance path.

## Alternatives considered

- **Compute in each child (prior state)** — Simple but duplicates work;
  the popup station's distance is calculated twice when a popup is open.
- **Memoize per-station inside each child** — Would eliminate the duplicate
  call but adds hook complexity in components that are already leaf nodes,
  and still doesn't share across the list-vs-popup boundary.

## Consequences

- **Positive:** Each station's GPS distance is computed at most once per
  render regardless of how many components display it. Single source of
  truth for distance data within a render.
- **Negative:** `MapPage` now owns a computation that is purely presentational
  in motivation. The `userDistances` Map must be threaded through `MapView`
  and `StationMarker` props even though neither component uses it directly —
  it is pass-through for `StationPopup`.
- **Follow-ups:** If additional components need per-station user distance
  (e.g., a future detail sheet), they can read from `userDistances` without
  adding another haversine call.

## Notes

- `userDistances` is `null` when `userPosition` is null (GPS not resolved),
  so both consumers correctly suppress the distance display in that case.
- The `filterCenter`-based distance used for **sorting** the list is separate
  and intentionally kept in `StationListView`; it uses a different origin
  point and serves a different purpose (see ADR-2026-04-15-distance-display-from-gps-only).
