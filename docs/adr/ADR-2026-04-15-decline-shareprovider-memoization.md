---
id: ADR-2026-04-15-decline-shareprovider-memoization
title: Do not memoize ShareProvider value or isolate it from MapPage
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, performance, context]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-react-memo-map-render-stability]
source: claude-code-session-2026-04-15 pr5-copilot-review-triage
---

## Context

`ShareProvider` in `src/context/ShareProvider.tsx` wraps `MapPage` and
the entire route tree in `src/App.tsx`. On PR #5, a Copilot review
comment observed that toggling `shareOpen` / `shareNotice` re-renders
the provider and could therefore re-render `MapPage` and the rest of
the subtree, noting the Leaflet map is likely the most expensive part
of the app. Copilot suggested memoizing the provider's `value` object
with `useCallback`/`useMemo`, wrapping `MapPage` in `React.memo`, or
rendering the share sheet/notice in a portal that is not a parent of
the map.

The concern needed evaluation in context rather than mechanical
acceptance, because React only re-renders **context consumers** on
state change, not every descendant of a provider.

## Decision

Decline the optimization. Leave `ShareProvider` wrapping the whole app
in `App.tsx` as-is, without `useMemo` on the value object and without
isolating it via a portal. `MapPage` does not call `useShare()` — only
the share trigger buttons consume the context — so toggling share
state does not cause `MapPage` or the Leaflet map to re-render. The
provider value object's identity changes on every render, but the only
consumers are the trigger buttons, which are trivially cheap.

## Alternatives considered

- **Memoize `{ openShare, closeShare }` with `useCallback`/`useMemo`** —
  would stabilize the context value identity. Rejected: consumers are
  cheap buttons; no observed perf problem to solve.
- **Wrap `MapPage` in `React.memo`** — already covered for internal
  map stability by `ADR-2026-04-15-react-memo-map-render-stability`.
  Additional wrapping at the MapPage level is unnecessary because
  MapPage isn't a share-context consumer.
- **Render share sheet/notice in a portal outside the map subtree** —
  same reasoning: no re-render problem exists, so restructuring the
  tree to avoid one adds complexity without benefit.

## Consequences

- **Positive:** Keeps `App.tsx` and `ShareProvider.tsx` simple; no
  premature optimization.
- **Negative:** If a future change adds a share-context consumer
  deep in the map subtree, this decision may need to be revisited.
  New consumers of `useShare()` should be reviewed for re-render
  impact.
- **Follow-ups:** If Leaflet performance later becomes the bottleneck
  for share-state changes (e.g., a new `useShare()` call is added to
  `MapView` or `StationMarker`), revisit and memoize then.

## Notes

Reasoning posted on PR #5 thread
`https://github.com/thomHayner/bicycle-repair-stations/pull/5#discussion_r3036464902`.
Thread resolved as "won't fix" in this session.
