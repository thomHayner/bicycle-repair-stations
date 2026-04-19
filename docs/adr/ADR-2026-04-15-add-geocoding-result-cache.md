---
id: ADR-2026-04-15-add-geocoding-result-cache
title: Cache Nominatim geocoding results in localStorage
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [caching, frontend]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 caching audit
---

## Context

A caching audit surfaced that every toolbar location search hits
`nominatim.openstreetmap.org` directly, with no deduplication of
repeat queries. Users searching the same city multiple times (or
re-entering a recent query) trigger a fresh network request every
time. Nominatim is a free service with a usage policy that rewards
client-side caching. The station-data cache (`brs_v3`) and settings
cache (`brs-theme`, `brs-unit`) established the project pattern of
using localStorage with defined TTLs and structure. Adding a third
cache fits that pattern.

## Decision

Added a localStorage-backed geocoding cache with the following
shape:

- **Key:** `brs_geocode`
- **Value:** `{ [queryLowercased]: { lat, lng, ts } }`
- **TTL:** 7 days
- **Eviction:** LRU, capped at 50 entries (oldest by `ts` evicted
  when full)
- **Key normalization:** query is lowercased and trimmed before
  lookup/insert, so `"Paris"`, `"paris"`, and `" paris "` share one
  entry
- **Error handling:** writes silently swallow errors (matches the
  convention in `stationCache.ts`)

Implementation lives inline in
`src/components/Toolbar/Toolbar.tsx` alongside the `geocode`
function.

## Alternatives considered

- **No cache** — rejected; wastes Nominatim capacity and slows repeat
  searches that could be instant.
- **sessionStorage** — rejected; users benefit from persistence
  across tab reloads and browser restarts, which is the common
  "I searched this yesterday" case.
- **In-memory Map** — rejected; lost on reload, same reason as
  sessionStorage.
- **IndexedDB** — rejected; overkill for ~50 small entries, adds
  complexity without benefit at this scale.
- **Unbounded cache / no LRU** — rejected; localStorage has a 5–10
  MB quota per origin and is shared with the station cache; an
  unbounded geocode cache could starve it.
- **Separate module (`geocodeCache.ts`)** — considered but left inline
  for now; the logic is ~30 lines and only used in one place. Can be
  extracted later if a second consumer appears.

## Consequences

- **Positive:** Repeat searches are instant. Reduced load on the
  public Nominatim endpoint.
- **Positive:** Consistent with the existing localStorage cache
  pattern documented in `CLAUDE.md`.
- **Negative:** The cache shape (`brs_geocode` key, value structure)
  is now a de-facto public contract for any user with cached
  entries. Changing it requires a version bump or risks orphaning
  data.
- **Negative:** Stale coordinates may be served if a place is
  renamed or relocated within the 7-day window — low risk in
  practice.
- **Follow-ups:** If the cache is extracted to `src/lib/`, update
  the localStorage caches table in `CLAUDE.md` to document
  `brs_geocode` alongside `brs_v3` and the settings keys.

## Notes

The inline geocode function in `Toolbar.tsx` was chosen over a
library (`src/lib/geocode.ts`) because it keeps the cache
implementation close to its only caller. If a second consumer
emerges (e.g. a map-click reverse-geocode), extract both the
function and the cache helpers at that point.
