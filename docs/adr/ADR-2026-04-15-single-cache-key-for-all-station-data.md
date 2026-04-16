---
id: ADR-2026-04-15-single-cache-key-for-all-station-data
title: Use a single localStorage key for both primary and wide-area station results
status: superseded
date: 2026-04-15
deciders: [tom]
tags: [caching, storage, overpass]
supersedes: []
superseded_by: [ADR-2026-04-15-scrap-250mi-fallback, ADR-2026-04-15-search-display-radius-revamp]
related: []
source: claude-code-session-2026-04-15 station-query-refactor
---

> **Superseded — retained for history.**
> The single-key principle still holds, but every concrete mechanism
> this ADR names is gone: the cache key has bumped to `brs_v3`
> ([`ADR-2026-04-15-search-display-radius-revamp`](ADR-2026-04-15-search-display-radius-revamp.md)),
> the `isWideFallback` flag was removed with the fallback itself
> ([`ADR-2026-04-15-scrap-250mi-fallback`](ADR-2026-04-15-scrap-250mi-fallback.md)),
> and the `isCovered` threshold follow-up is resolved by
> [`ADR-2026-04-08-cache-geometric-containment`](ADR-2026-04-08-cache-geometric-containment.md).

## Context

The primary Overpass query (`useStationQuery`) caches a 65 km radius of station
data in localStorage under `"brs_v2"` with a 24-hour TTL. When that query returns
zero results the hook escalates to a 250-mile wide-area fallback search and returns
the 5 nearest stations.

The original plan for this refactor proposed caching wide-area results under a
**separate** key — `"brs_fallback_v1"` — with a shorter TTL (6 hours). This would
prevent repeat API calls when a user revisits a station-free area. The user rejected
the two-key approach explicitly ("I don't want separate storages"), prompting a
redesign.

## Decision

All station data — both normal 65 km results and wide-area fallback results — is
stored under the single existing key `"brs_v2"`. The `StationCache` type is extended
with an optional `isWideFallback?: boolean` field that the hook sets to `true` when
caching a wide-area result. On read, the hook checks this flag to decide whether to
return `{ status: "success" }` or `{ status: "success-wide", farthestMi }`, and it
recomputes `farthestMi` from the stored stations and the current lat/lng rather than
persisting it.

## Alternatives considered

- **Separate `"brs_fallback_v1"` key with 6-hour TTL** — rejected by the user; they
  want to avoid parallel cache management complexity and the cognitive overhead of
  multiple keys with different eviction strategies.
- **No caching for wide-area results** — rejected. Every visit to a station-free area
  would re-fire a 250-mile Overpass query (60-second timeout), which is wasteful and
  slow.

## Consequences

- **Positive:**
  - Single eviction path — one key, one TTL, one `clear()` call.
  - Wide-area results benefit from the existing 24-hour cache, avoiding repeat API
    calls in station-free areas.
  - `readCache` / `writeCache` / `isCovered` in `src/lib/stationCache.ts` are
    unchanged in signature; only the type gains `isWideFallback?`.
- **Negative:**
  - Wide-area results inherit the same 24-hour TTL as primary results, even though
    they cover a much larger radius. A new station added within a previously empty
    area won't appear for up to 24 hours.
  - `isCovered()` uses the existing ≈24.7 km threshold, which is calibrated for the
    65 km primary radius. For a wide-area cache entry, the coverage check may produce
    unexpected behaviour if the user moves significantly. Not discussed further in
    this session.
- **Follow-ups:**
  - Consider whether `isWideFallback` cache entries should use a different TTL or
    coverage threshold, once we have more data on how often users visit station-free
    areas.

## Notes

- `StationCache` lives in `src/lib/stationCache.ts`.
- The flag is set in `src/hooks/useStationQuery.ts` when writing a wide-area result.
