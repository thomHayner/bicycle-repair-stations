---
id: ADR-2026-04-15-search-display-radius-revamp
title: Decouple fetch radius from display radius and remove zoom-driven filter changes
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [frontend, ux, data-fetching, cache]
supersedes: [ADR-2026-04-15-auto-radius-min-five-stations, ADR-2026-04-15-single-cache-key-for-all-station-data]
superseded_by: []
related: [ADR-2026-04-15-scrap-250mi-fallback]
source: claude-code-session-2026-04-15 search-zoom-revamp
---

## Context

The previous behaviour had several auto-radius mechanics that felt unnatural:

1. **Zoom-driven filter expansion** (`handleVisibleWidthChange`): panning or zooming the map out would automatically increase `selectedDist` to the largest preset that fit the visible map width. This meant the filter changed without any user action, which surprised users.
2. **Auto-radius on new location** (`autoRadiusLocationRef` effect): on a fresh location the app would find the smallest radius with ≥ 5 stations and zoom to that. The ≥ 5 threshold often skipped the user to a wide radius even when one or two nearby stations existed.
3. **Fetch radius (65 km / ~40 mi) much larger than max display (25 mi)**: the generous fetch buffer was designed to allow the wide display radius and the zoom-driven expansion to work. Once those were removed, the oversized fetch became waste.
4. **Initial display radius of 1 mi** regardless of unit preference — in km mode this rendered as "1 km" (~0.6 mi), which was too tight.

The goal was to replace all of this with predictable, Google Maps-style behaviour: a fixed fetch radius, a sensible default the user starts from, and a simple step-up on a new location that the user can then override freely.

## Decision

We reduced `FETCH_RADIUS_KM` from 65 to 40.2335 (exactly 25 miles × 1.60934) and set a fixed `REFETCH_THRESHOLD_KM` of 8.047 km (5 miles), decoupled from the display radius. The default `selectedDist` is now unit-aware (2 for "mi", 5 for "km"). Zoom events no longer touch `selectedDist` at all — `handleVisibleWidthChange` and the `onVisibleWidthChange` prop chain were deleted entirely. On a fresh `givenLocation`, the auto-step effect starts from the 2-mi / 5-km default and steps up through the options until it finds ≥ 1 station (not ≥ 5), then calls `fitBounds` to that radius. After that, `selectedDist` is only changed by explicit user pill taps or a unit toggle. The cache key was bumped from `brs_v2` to `brs_v3` to invalidate stale 65-km cache entries in existing users' browsers.

## Alternatives considered

- **Keep 65 km fetch with smaller default display** — would preserve the large data buffer but still requires explaining why we fetch far more than we show. Rejected: the buffer was only needed for the zoom-driven expansion, which was itself being removed.
- **Keep zoom-driven expansion, just reduce it** — e.g. only expand when the user explicitly zooms out past the current radius, not continuously. Rejected: still auto-changes a control the user set, which is the core problem.
- **Keep ≥ 5 threshold for auto-step** — the original logic required 5 stations before settling on a radius. Rejected: in sparse areas this forced a wide radius even when 1–2 stations were nearby; ≥ 1 is more honest about what's available.

## Consequences

- **Positive:** Display radius is now purely user-controlled after the initial auto-step. Zooming and panning never change a pill the user set. Fetch payload is ~62% smaller (25 mi vs ~40 mi radius → area ratio ≈ (25/40)²). Default view is tighter and more immediately useful in urban areas.
- **Negative:** Users who move more than 5 miles from the last fetch centre will trigger a re-fetch sooner than before (old threshold was ~15 miles). At the maximum 25-mi display radius, users who move ~5 miles may see a brief reload; previously they could move ~15 miles without one.
- **Follow-ups:** Consider whether the 5-mile refetch threshold is the right trade-off in practice. Monitor whether the tighter radius causes noticeable refetch frequency complaints.

## Notes

The `REFETCH_THRESHOLD_KM` is now a flat constant rather than derived from `FETCH_RADIUS_KM - MAX_DISPLAY_KM`. `MAX_DISPLAY_KM` was deleted as it no longer serves a purpose. The `tooZoomedOut` banner (shown when visible map width > 75 miles) was intentionally preserved — it is about map readability, not data coverage.
