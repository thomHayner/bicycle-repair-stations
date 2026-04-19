---
id: ADR-2026-04-15-querystatus-prop-for-station-list-header
title: Pass queryStatus discriminated union (not boolean) to StationListView; centralize header text in getHeaderState()
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, data-flow, ux]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-adjust-state-during-render-station-query]
source: claude-code-session-2026-04-15 stale-frame header flash fix
---

## Context

`StationListView` rendered header text from three scattered ternaries,
gated on an `isFetchingStations: boolean` prop. A boolean cannot
distinguish between:

- `"idle"` — query has not run yet (e.g., before geolocation
  resolves), `total === 0` — header should say "Searching nearby…".
- `"success"` with `total === 0` — query completed and truly found
  nothing — header should say "No stations found".

Both collapse to `isFetchingStations === false && total === 0`, so
"No stations found" leaked through the idle state. Prior attempts to
patch this:

- Add `!isFetchingStations` gate on the "No stations found" branch —
  evaluated true during idle, bug persists.
- Expand `isFetchingStations` to include idle — breaks the search
  pill / spinner elsewhere in `MapPage`, which needs
  `isFetchingStations === true` to mean "Overpass request is in
  flight" (not "we haven't started yet").

The scattered ternaries also made it hard to reason about which text
appears in which combination of states, and the "expanded panel
empty state" had its own duplicated condition tree.

## Decision

In `src/components/StationListView.tsx`:

- Export `type QueryStatus = "idle" | "loading" | "success" | "none" | "error"`.
- Replace the `isFetchingStations?: boolean` prop with
  `queryStatus: QueryStatus`.
- Introduce a single pure function
  `getHeaderState(queryStatus, total, shown, hasActiveFilters, selectedDist, unit)`
  that returns `{ text, pulse, emptyPanelText }`. This function is the
  **sole source of truth** for all header text, the `animate-pulse`
  flag, and the expanded-panel empty-state text. All three
  ternaries are deleted.
- Add a `key` prop on the header `<span>` keyed on the displayed text
  category so that React unmounts and remounts the DOM node when the
  state changes. This provides an additional guarantee that no
  browser rendering artifact can show stale text content.

In `src/pages/MapPage.tsx`:

- Pass `queryStatus={query.status}` to `<StationListView>`. The
  existing `isFetchingStations` local (`query.status === "loading"`)
  remains for other consumers (search pill/spinner).

The `QueryStatus` type mirrors the discriminants of
`StationQueryState` from `useStationQuery.ts` but is declared
locally in `StationListView`. The component owns its prop contract.

## Alternatives considered

- **Keep boolean, add more gates** — rejected: the boolean is
  lossy. Every patch would need to hard-code additional assumptions
  about which states a given call site is currently in, which
  reintroduces the same class of bug whenever a state is added.
- **Expand boolean semantics to include idle** — rejected: breaks
  the search pill/spinner which has a different notion of "fetching"
  (in-flight, not pre-query).
- **Move all header text to i18n keys and gate in the i18n layer** —
  rejected: out of scope for this bug fix, and the header was not
  i18n'd previously. See Notes.
- **Re-export `StationQueryState` from `useStationQuery.ts` and
  accept the whole object** — rejected: `StationListView` only needs
  the discriminant; passing the full union would couple the view to
  the hook's internal shape (e.g., the `stations` array on
  `success`).

## Consequences

- **Positive:** Header text is deterministic — one function, one
  reviewable switch ladder. Adding a new status value becomes a
  compile-time obligation in `getHeaderState`. All branches live in
  one place, eliminating the "multiple overlapping problems due to
  multiple items trying to render in the same place" that the user
  flagged during the session.
- **Negative:** Prop shape change — any future consumer of
  `StationListView` must supply `queryStatus` rather than a boolean.
  The `QueryStatus` type is effectively duplicated with
  `StationQueryState`'s discriminants; if the hook ever adds a new
  status, both declarations must be updated (TypeScript will catch
  the mismatch at the `MapPage` call site).
- **Follow-ups:** If `StationListView` grows more status-driven
  text, keep all of it inside `getHeaderState` rather than adding
  new ternaries at the JSX site.

## Notes

- Header strings remain hardcoded English. The component's existing
  strings were also hardcoded English; i18n for the header is out of
  scope for this decision and would be a separate ADR.
- The `key`-prop tactic is a belt-and-suspenders measure against
  textContent-mutation visual artifacts; it is not strictly needed
  once the stale-frame fix from the related ADR is in place, but it
  costs effectively nothing and defends against any future code path
  that might still produce a transient bad render.
- The companion fix at the hook layer
  (ADR-2026-04-15-adjust-state-during-render-station-query) is what
  actually eliminates the flash; this ADR is about making the text
  selection robust and centralized so that future status additions
  cannot reintroduce a similar bug.
