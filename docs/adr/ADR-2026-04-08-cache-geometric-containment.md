---
id: ADR-2026-04-08-cache-geometric-containment
title: Use geometric containment for station-cache coverage checks
status: accepted
date: 2026-04-08
deciders: [tom]
tags: [caching, overpass, stations]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-single-cache-key-for-all-station-data]
source: claude-code-session-2026-04-08 copilot-review-pr-20
---

## Context

`isCovered(lat, lng, cache)` in `src/lib/stationCache.ts` decides
whether a fresh fetch can be skipped because the cached station data
already covers the user's current position. The original
implementation compared the distance between the current point and
the cache center against a fixed `refetchThreshold()` — roughly 20 %
of the primary fetch radius (`≈ 13 km` for the 65 km primary fetch,
derived via a helper that scaled the threshold with the cache's own
radius).

This approach worked for same-size refetches (primary → primary) but
produced a real bug once wide-area caches entered the mix
([related ADR](ADR-2026-04-15-single-cache-key-for-all-station-data.md)):

- A 250 mi (≈ 402 km) wide-area cache would compute its own
  threshold as `0.20 × 402 km ≈ 80 km`.
- A subsequent 25 mi lookup near the cache center should obviously
  reuse that cache — a 25 mi query is entirely inside a 250 mi disk.
- But the 20 %-of-cache-radius threshold was an *independent*
  proximity check that had nothing to do with the new query's
  radius. In edge cases — and Copilot's review spotted this — the
  math could go the other way, forcing a refetch even though the
  needed data was demonstrably cached.

The review on PR #20 pushed on the threshold model directly and
proposed switching to a geometric check.

## Decision

Replace the radius-scaled proximity threshold with **explicit
geometric containment**: a cached disk of radius `cache.radiusKm`
centred at `cache.center` covers a new query of radius
`neededRadiusKm` centred at `(lat, lng)` if and only if

```
distKm(queryCenter, cacheCenter) + neededRadiusKm ≤ cache.radiusKm
```

Concretely, `isCovered` now takes a third argument
`neededRadiusKm: number = FETCH_RADIUS_KM` and returns

```ts
const distKm =
  haversineDistanceMiles(lat, lng, cache.center.lat, cache.center.lng)
  * 1.60934;
return distKm + neededRadiusKm <= cache.radiusKm;
```

`refetchThreshold()` is removed entirely.

## Alternatives considered

- **Keep the 20 %-of-cache-radius threshold** — rejected. As above,
  it is not a function of the incoming query radius, so it
  produces bad answers when cache radius ≠ query radius (the new,
  normal state of the world after wide-area fallback was added).
- **Use `cache.radiusKm` for the threshold instead of a 20 % slice**
  — considered. Equivalent to "query center must be inside the
  cached disk," which is necessary but not *sufficient* for
  coverage: a query centred at the edge of the cached disk still
  extends halfway outside it. Geometric containment is the right
  condition; the `cache.radiusKm`-threshold variant is a strict
  subset of this logic and wins nothing.
- **Always refetch (drop the cache check)** — rejected. Kills the
  point of the cache.

## Consequences

- **Positive:**
  - Correct by construction: a query is served from cache iff the
    cache provably covers the query disk, for any combination of
    cache radius and query radius.
  - Removes a helper (`refetchThreshold`) and the "20 %" magic
    number — the logic is now one line with an obvious geometric
    reading.
  - The [single-cache-key ADR](ADR-2026-04-15-single-cache-key-for-all-station-data.md)
    listed the old threshold's unsuitability for wide-area entries
    as an open follow-up; this resolves that follow-up.
- **Negative:**
  - Slightly stricter than the old threshold near the cache edge —
    a query whose disk barely pokes outside the cached disk now
    refetches, where the old threshold might have allowed it. Net
    effect is more API calls in a narrow band around the cache
    boundary. Acceptable tradeoff for correctness.
  - All callers of `isCovered` must pass `neededRadiusKm` when
    checking against non-default query sizes. Default argument
    covers the primary fetch path unchanged.
- **Follow-ups:**
  - None. The follow-up noted in the related ADR
    (`isCovered` behaviour for wide-area cache entries) is resolved
    by this change.

## Notes

- Change in `src/lib/stationCache.ts` (commit `1b7d49f`,
  2026-04-08), shipped alongside PR #20's Copilot-review fixes.
- The localStorage cache key was also bumped in this period from
  `brs_v2` → `brs_v3` (see `CLAUDE.md`), ensuring stored caches
  from the old-threshold era aren't read by the new geometric
  logic.
- Uses `haversineDistanceMiles` from `src/lib/distance.ts`
  multiplied by `1.60934` to convert to km. A direct
  `haversineDistanceKm` helper would be marginally cleaner but was
  not added; this is noted only as a minor future refactor.
