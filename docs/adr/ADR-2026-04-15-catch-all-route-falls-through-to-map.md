---
id: ADR-2026-04-15-catch-all-route-falls-through-to-map
title: Unmatched routes fall through to the always-mounted map
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [frontend, routing]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 routing catch-all
---

## Context

`MapPage` is rendered outside `<Routes>` in `App.tsx` so that navigating
to overlay pages (`/guides`, `/about`, `/donate`) never unmounts the
map. `<Routes>` only contained the three overlay routes, so React
Router logged `No routes matched location "/"` to the console on
every visit to the index path (and would do the same for any unlisted
path).

The "MapPage outside Routes" pattern itself was questioned during the
session. It was kept: it's a valid pattern for map-centric apps where
the map must persist across navigation to preserve state (position,
zoom, tile cache). The question then became how to handle unmatched
paths inside `<Routes>`.

## Decision

Add a single catch-all route `<Route path="*" element={null} />` as
the last child of `<Routes>` in `src/App.tsx`. Any path not matched
by a declared overlay route (including `/` and arbitrary paths like
`/random`) renders `null` on top of the always-mounted `MapPage`,
which means the user sees the map.

## Alternatives considered

- **`<Route path="/" element={null} />`** — only silences the warning
  for exactly `/`. Unmatched paths like `/random` would still warn.
  Rejected in favor of the broader catch-all.
- **Add a 404 page now** — deferred. The user noted that for this app
  it makes more sense for unlisted routes to go to the map rather
  than a 404. If a 404 is added later, it will replace `null` in the
  existing catch-all route.
- **Refactor so MapPage lives inside `<Routes>` as the `/` route** —
  rejected. Would require either duplicating `MapPage` across routes
  or restructuring the overlay-over-map architecture, both of which
  risk unmounting/remounting the map and losing map state.

## Consequences

- **Positive:** React Router warning is silenced for all paths. The
  routing pattern (overlay pages inside `<Routes>`, map underneath)
  is now explicit and self-consistent — unmatched paths have a
  defined behavior rather than being an accidental edge case.
- **Negative:** There is no 404 page; users who type a bad URL land
  silently on the map with no indication that their path was wrong.
- **Follow-ups:** If a 404 page is added later, replace `null` with
  the `<NotFoundPage />` component in the catch-all route. Decide at
  that point whether truly unknown paths should 404 or continue
  falling through to the map.

## Notes

The "MapPage always mounted" pattern is already documented in
`CLAUDE.md` ("MapPage is **always mounted** — it is never unmounted
on navigation. Other pages render in a portal over the map."). This
ADR captures the routing-level corollary: unmatched paths are a
no-op overlay, not an error.

Verified in the dev preview: no new `No routes matched` warnings
emitted after the change on `/` or `/random`; map renders in both
cases.
