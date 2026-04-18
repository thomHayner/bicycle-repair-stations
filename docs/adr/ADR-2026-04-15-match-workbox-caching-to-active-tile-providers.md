---
id: ADR-2026-04-15-match-workbox-caching-to-active-tile-providers
title: Match Workbox runtime tile caching to the tile providers actually used
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [caching, pwa, tiles]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 caching audit
---

## Context

A caching audit surfaced that the Workbox `runtimeCaching` rule in
`vite.config.ts` matched
`https://[a-z].tile.openstreetmap.org/.*` — a URL pattern the app
never requests. The actual tile sources used by `MapView.tsx` are:

- **CARTO** (`{a,b,c,d}.basemaps.cartocdn.com`) — Voyager, Positron
  / `light_all`, and `voyager_only_labels` for the cycling,
  standard, and satellite-labels layers
- **ESRI World Imagery** (`server.arcgisonline.com`) — satellite
  base layer
- **Waymarked Trails** (`tile.waymarkedtrails.org`) — cycling and
  MTB route overlays

None of these matched the OSM rule, so service-worker runtime
caching was effectively unconfigured. Fixing this meant deciding
*which* providers to cache, whether to share one cache or split per
provider, and per-cache bounds.

## Decision

Replaced the single dead OSM rule with three `CacheFirst` rules, one
per provider, with separate cache names and tuned `maxEntries`
caps. All three share a 7-day `maxAgeSeconds`.

| Provider | Regex | Cache name | maxEntries |
|---|---|---|---|
| CARTO | `^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*` | `carto-tiles` | 800 |
| ESRI | `^https:\/\/server\.arcgisonline\.com\/.*` | `esri-tiles` | 300 |
| Waymarked Trails | `^https:\/\/tile\.waymarkedtrails\.org\/.*` | `waymarked-tiles` | 400 |

Cap sizes reflect relative usage: CARTO is on every layer (largest),
ESRI is satellite-only (smaller), Waymarked is overlay-only and can
be double-loaded (cycling + MTB) on the cycling layer (medium).

## Alternatives considered

- **Leave the OSM rule in place** — rejected; it caches nothing the
  app requests.
- **Keep the OSM rule *and* add the new ones** — rejected; dead code
  is confusing; remove it.
- **One shared `map-tiles` cache for all providers** — rejected; a
  single `maxEntries` cap forces a trade-off across providers with
  different usage patterns. Separate caches let each provider
  expire independently.
- **No cap / `maxAgeSeconds` only** — rejected; unbounded SW caches
  can grow indefinitely, especially for satellite tiles.
- **Different TTLs per provider** — considered; the tile data from
  all three is similarly stable (road networks, satellite imagery,
  trail data), so a uniform 7 days is simpler. Revisit if one
  provider proves more volatile.

## Consequences

- **Positive:** Offline-first tile loading now actually works for
  the layers the app uses. Repeat sessions serve tiles from the SW
  cache instead of the network.
- **Positive:** Mitigates upstream outages — notably the
  intermittent 502s observed from `tile.waymarkedtrails.org`.
  Once a tile loads successfully, subsequent requests hit the cache
  for 7 days.
- **Positive:** Per-provider cache names let dev tools and future
  diagnostics identify which source is backing a given tile.
- **Negative:** Three cache namespaces now live in users' Service
  Worker storage. Renaming them later orphans existing entries
  until Workbox expiration logic prunes them.
- **Negative:** A user who downloads a lot of CARTO tiles can
  approach the 800-entry cap; least-recently-used eviction is
  automatic via Workbox's `expiration` plugin, but cap tuning may
  need revisiting.
- **Follow-ups:** Monitor whether any provider's `maxEntries` cap is
  routinely hit (would show up as repeated network fetches for
  previously-seen tiles). Consider whether to add a fourth rule if
  a new tile source is introduced.

## Notes

The manifest 401 and Waymarked Trails 502 errors surfaced in the
same session were confirmed *not* caused by this change — the 401
is a hosting-level auth issue on `dev.bicyclerepairstations.com`,
and the 502s are upstream server instability. The caching change
helps mitigate the 502 symptom on repeat visits.
