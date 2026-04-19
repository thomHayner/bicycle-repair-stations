---
id: ADR-2026-04-07-station-list-progressive-pagination
title: Paginate the station list via progressive scroll loading
status: accepted
date: 2026-04-07
deciders: [thomHayner]
tags: [performance, ux, react, station-list]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-08 error-handling-polish
---

## Context

Wide-area searches (the "Search this area" flow at up to 250 mi) can
return hundreds of stations. `StationListView` previously rendered
every filtered station at once. Each row is a non-trivial React
component (icon, name, distance, amenity pills), and the drawer's
scroll container does not virtualize — so for a 250 mi result near a
dense region, initial render hitched noticeably on low-end Android.

The Copilot review on PR #18 flagged large result sets as a perf
concern; the user initially considered it a warning safe to ignore,
but followed up with *"I feel like we should polish the large result
set now."*

The decision had to balance three things: render cost, added code/dep
weight, and the fact that most sessions never see >20 results (1 mi
and 5 mi are the common defaults).

## Decision

Render the station list in progressively larger slices using local
component state and a scroll-position check — no virtualization
library, no external dependency.

- `PAGE_SIZE = 20` rows rendered initially.
- A `visibleCount` `useState` tracks how many rows to slice.
- An `onScroll` handler on the scroll container increments
  `visibleCount += PAGE_SIZE` when the user is within **100 px** of
  the bottom.
- When the `filtered` prop identity changes (new search, new filter,
  new location), reset `visibleCount` back to `PAGE_SIZE` using the
  **adjust-state-during-render** pattern (per React docs), so the
  reset lands in the same render that consumes the new `filtered`
  array rather than flashing the old slice:
  ```ts
  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (prevFiltered !== filtered) {
    setPrevFiltered(filtered);
    if (visibleCount !== PAGE_SIZE) setVisibleCount(PAGE_SIZE);
  }
  ```
- A "Showing N of M — scroll for more" hint appears at the bottom of
  the list when `visibleCount < filtered.length`.

## Alternatives considered

- **Do nothing** — rejected after the follow-up user instruction. The
  cost is paid on every wide-area search, not just pathological
  cases.
- **Virtualization (`react-window` / `@tanstack/virtual`)** —
  rejected. Adds a dependency, constrains row layout (fixed or
  measured heights), and the list's natural behaviour (variable
  row heights when amenity pills wrap) is awkward to virtualize.
  Progressive rendering captures ~95% of the benefit at near-zero
  cost.
- **"Show more" button** — rejected. Infinite-scroll-style progressive
  loading is more natural in a scrolling drawer; a button introduces
  an interaction the user has to find and tap.
- **`useRef` instead of `useState` for the reset sentinel** — tried
  first, blocked by the `react-hooks/refs` lint rule (refs cannot be
  read/written during render). Switched to the `useState`
  adjust-state-during-render pattern, which React's docs endorse for
  exactly this case.

## Consequences

- **Positive:**
  - Initial render of wide-area results is capped at 20 rows
    regardless of result size.
  - Zero new dependencies, zero new files — all changes are local to
    `StationListView.tsx`.
  - The adjust-state-during-render reset avoids the stale-frame flash
    that a `useEffect` reset would produce when `filtered` changes.
- **Negative:**
  - `onScroll` fires frequently during fast scrolls. The check is
    cheap (a subtraction) but the handler isn't debounced.
  - `PAGE_SIZE = 20` and the 100 px threshold are hardcoded. If row
    heights change materially (e.g., redesign), the threshold may
    trigger too early or too late.
  - The "Showing N of M" hint is another user-visible string that
    needs i18n once the i18n sweep reaches this component.
- **Follow-ups:**
  - If we ever add virtualization elsewhere, revisit whether the
    station list should share that library for consistency.

## Notes

- Implementation in `src/components/StationListView.tsx` (commit
  `84919ca`, 2026-04-07).
- Verified by 9 unit tests in `src/components/StationListView.test.tsx`
  added 2026-04-08 — initial render cap, hint display, scroll-to-load,
  reset on prop change, edge cases (empty list, exactly `PAGE_SIZE`
  items). All pass.
- The adjust-state-during-render pattern is called out in `CLAUDE.md`
  under "Intentional Patterns — Do Not Flag" (originally for
  `useStationQuery`; this is a second occurrence of the same
  pattern).
