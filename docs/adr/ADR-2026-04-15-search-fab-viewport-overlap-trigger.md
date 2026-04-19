---
id: ADR-2026-04-15-search-fab-viewport-overlap-trigger
title: Trigger "Search this area" FAB by viewport overlap, not pan distance
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [map, ux, search]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-programmatic-move-counter-ref]
source: claude-code-session-2026-04-15 search-fab-triggers
---

## Context

The "Search this area" FAB previously appeared only after the user
panned **more than 18 miles** in a straight line from the last
searched location. This was non-standard: Google Maps, Apple Maps,
and Airbnb show the button based on how much of the *visible
viewport* has changed since the last search, not a fixed
great-circle distance. A pure distance threshold ignores zoom — at
high zoom a small pan can reveal an entirely new area, and at low
zoom 18 miles barely moves the viewport.

The app fetches stations in a 25-mile radius and is intended for
people who want to walk or limp-ride their bike to a nearby repair
station, so data doesn't go stale as quickly as in a restaurant or
hotel app. We want a looser buffer than Google/Apple defaults.

## Decision

Show the FAB when less than **70%** of the last-searched viewport
bounds remain visible in the current viewport. Bounds are captured
at the moment a search completes (either via
`handleProgrammaticMoveEnd` settling, or as a fallback when
`givenLocation` changes). Overlap is computed as the intersection
area of the two `LatLngBounds` divided by the last-searched bounds
area — inherently scale-aware, so a pan that shifts 30%+ of the
visible map at any zoom triggers the button.

The check runs on every Leaflet `drag` event (real-time during the
pan, so the button can appear mid-gesture) and again on `moveend`
(catches zoom buttons, scroll wheel, pinch). No debounce.

## Alternatives considered

- **Keep the 18-mile distance threshold** — rejected: non-standard,
  zoom-blind, and the original motivation for this redesign.
- **Pixel-distance threshold (e.g., panned > N viewport widths)** —
  rejected: viewport overlap is equivalent for rectangular viewports
  and expresses the intent ("how much of what you searched is still
  visible?") more directly.
- **50% overlap threshold** — tried first; felt too loose. Large
  pans registered, but the "map has clearly moved, where's the
  button?" feeling persisted longer than expected.
- **Debounce the user-move handler by 300ms** — tried first; felt
  laggy because the button wouldn't appear until the finger lifted.
  Dropped in favor of the real-time `drag` event.

## Consequences

- **Positive:** matches the mental model users already have from
  other map apps. Zoom-aware by construction — the same gesture
  triggers the button regardless of zoom level.
- **Positive:** button can appear mid-drag, which feels responsive.
- **Negative:** on initial load, the first bounds snapshot is
  whatever the map lands on after geolocation settles. If that
  initial view is zoomed out, a user who pans before zooming will
  feel a longer delay before the button shows, because 30% of a
  wide viewport is a lot of ground to cover.
- **Follow-ups:** consider whether the threshold should scale with
  zoom level, or whether the "initial load" bounds snapshot should
  wait for the user to interact once before being captured.

## Notes

User confirmed the tuning in-session:

> "a little bit tighter might be better, you are right about the
> disconnect with 'the map has moved so its a new frame'"

— which motivated the 50% → 70% bump.

> "does the button wait until panEnd to show? if so can it happen
> in real time during panning?"

— which motivated wiring the `drag` event and dropping the debounce.

The overlap helper is defined in `src/pages/MapPage.tsx` as
`boundsOverlapRatio(a, b)` and operates on raw lat/lng deltas
(degrees, not meters). This is accurate enough for the UX decision
being made; we are not measuring real-world area.
