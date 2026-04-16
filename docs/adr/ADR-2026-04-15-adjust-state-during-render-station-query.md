---
id: ADR-2026-04-15-adjust-state-during-render-station-query
title: Use "adjust state during render" in useStationQuery to eliminate stale-frame flash
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [frontend, react, data-flow]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-querystatus-prop-for-station-list-header]
source: claude-code-session-2026-04-15 stale-frame header flash fix
---

## Context

When `givenLocation` changed (e.g., the user searched a different city),
the station list header briefly flashed "No stations found" before
settling on "Searching nearby…". The cause was a stale render frame:

- `filterCenter` in `MapPage` updates synchronously when `givenLocation`
  changes.
- `allStations` is derived from `useStationQuery`'s state via `useMemo`
  and holds the *previous* location's results until `useStationQuery`
  updates.
- `useStationQuery`'s existing update path is a `useEffect`, which fires
  **after** the browser paints.

So on the first render after the coord change, the component renders
with new `filterCenter` + old `allStations` → the haversine filter
yields 0 results → `total === 0` → the header renders "No stations
found" for one visible frame before the effect transitions status to
`"loading"`.

Prior attempts to patch the symptom in the UI layer all failed:
boolean "idle gates", expanding the `isFetchingStations` flag to
include idle, and CSS-only fixes. None addressed the stale frame
itself — the DOM was still receiving wrong text, however briefly.

## Decision

Detect coordinate changes **during render** inside `useStationQuery`
(`src/hooks/useStationQuery.ts`) by storing the last-seen `lat`/`lng`
in a `useState` value (`prevCoords`) and comparing on every render.
When incoming coords differ from `prevCoords`:

- If the cache covers the new coords, call
  `setState({ status: "success", stations: cached.stations })` and
  update `prevCoords` — all during render.
- Otherwise, call `setState({ status: "loading" })` and update
  `prevCoords` — again, during render.

React treats state updates issued during render as a signal to
re-render synchronously with the new state before committing to the
DOM. The stale "success" frame never paints.

The existing `useEffect` still handles the actual fetch and the
cache-hit fast path; it is unchanged in structure.

## Alternatives considered

- **Effect-only (prior state)** — rejected: `useEffect` runs after
  paint, which is precisely what allows the stale frame to reach the
  screen. This is the baseline that was broken.
- **Track previous coords with `useRef`** — rejected: the project's
  `react-hooks/refs` ESLint rule disallows reading `ref.current` during
  render. The first implementation of this fix used a
  `lastCoordsRef` and produced 12 lint errors on the ref-access
  lines. React's own documentation also prefers `useState` for
  previous-props comparison; `useRef` is appropriate for values that
  are *not* inputs to render.
- **Tighten `useMemo` dependencies in `MapPage` to somehow defer
  `filteredStations` until the query updates** — rejected: would
  require coupling `MapPage`'s memoization to the query's internal
  state transitions, propagating the problem instead of fixing it at
  the source.

## Consequences

- **Positive:** Stale frame eliminated at the source. UI components
  downstream (`StationListView`, search pill) receive a consistent
  status in the same render that receives new coords. No additional
  workaround is needed in the view layer for this specific cause.
- **Negative:** Calling `setState` during render is an unusual
  pattern that looks like it could infinite-loop on casual review.
  The guard clauses (`coordsChanged`, `state.status !== "loading"`)
  prevent re-triggering, but the hook requires a comment explaining
  the invariant and why this is not an effect.
- **Follow-ups:** If other hooks in the project develop similar
  "need to invalidate state synchronously on prop change" needs, this
  pattern is the reference implementation.

## Notes

- The "Adjust state during render" pattern is already documented in
  the project's `CLAUDE.md` under "Intentional Patterns — Do Not
  Flag", which references the same technique used by a sibling hook.
  This ADR records a second application of that pattern.
- ESLint rule `react-hooks/refs` was what surfaced the `useRef`
  dead-end; the 12-error wall forced the move to `useState` and is
  the reason the chosen pattern is "the only one that compiles".
- The existing `useEffect` still retains its
  `eslint-disable-next-line react-hooks/set-state-in-effect` comment
  on the cache-hit branch for the same reason it always had —
  latching cached data synchronously is correct here.
