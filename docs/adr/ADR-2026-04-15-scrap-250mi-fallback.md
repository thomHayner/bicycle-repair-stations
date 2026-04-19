---
id: ADR-2026-04-15-scrap-250mi-fallback
title: Remove the 250-mile wide-area fallback search
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, ux, data-fetching]
supersedes: [ADR-2026-04-15-single-cache-key-for-all-station-data]
superseded_by: []
related: [ADR-2026-04-15-search-display-radius-revamp]
source: claude-code-session-2026-04-15 fallback-removal
---

## Context

When the primary 25-mile Overpass fetch returned 0 stations, the app would automatically escalate to a second fetch covering 250 miles, return the nearest 20 stations (previously 5), cache them as `isWideFallback: true`, and display them with the distance pills disabled.

This produced several UX problems:

- The distance pills were dimmed in fallback mode, but there was no explicit way to exit fallback mode or understand why the pills were greyed out.
- The list header said "Searching wider area…" during escalation and "No stations within 250 miles" on empty — neither message told the user what to *do* next.
- The `success-wide` state spread conditional branches through `MapPage`, `StationListView`, `useStationQuery`, and `stationCache`, making the query lifecycle harder to follow.
- The primary use case for this app is a cyclist whose bike just broke down. Someone in a genuine bicycle-desert is not going to cycle 80–150 miles to a repair station; the wide-area result provides false hope rather than useful information.

The question was whether the fallback was worth the complexity it added.

## Decision

We removed the 250-mile fallback entirely. When the primary 25-mile fetch returns 0 stations, the state machine transitions directly to `"none"`. The list shows "No stations found in this area" and the distance pills remain active (the user can try widening manually, though they will still get 0 results). The user's recovery path is to search a different location using the toolbar search bar or the "Search this area" button after panning.

The `"escalating"` and `"success-wide"` states were deleted from `StationQueryState`. `computeFarthestMi`, `stateFromCache`, `isWideFallback`, `FALLBACK_RADIUS_MI/KM`, `FALLBACK_TIMEOUT_S`, `FALLBACK_COUNT`, and all associated UI branches were removed.

## Alternatives considered

- **Option A: Keep fallback, improve the UX messaging** — Replace dimmed pills with a contextual banner ("No stations within 25 miles — showing nearest stations"), hide the pill row in fallback mode, add a clear exit path. This would have preserved the wide-area search capability at the cost of keeping the state machine complexity and adding new UI work. Rejected: the primary scenario (real-time breakdown) doesn't benefit from knowing the nearest station is 120 miles away.
- **Option B: Add a "250 mi" pill** — Keep the pills always visible and add a 250-mi option for users to opt into wide-area search. Rejected: selecting a small radius (e.g. 5 mi) while in fallback mode would show 0 stations, which is confusing. The pill model implies a display filter, not a search trigger — the semantics don't map cleanly.
- **Option C: Scrap it (chosen)** — Delete all fallback logic. If nothing is found within 25 miles, say so and let the user search somewhere else manually.

## Consequences

- **Positive:** `StationQueryState` is now a simple 5-state machine (`idle | loading | success | none | error`). All fallback-related branches removed from `MapPage`, `StationListView`, `stationCache`, and `useStationQuery`. Significantly less code to maintain. The `StationListView` component no longer needs `fallbackStatus`, `fallbackRadiusMi`, or `pillsDisabled` props.
- **Negative:** Users in a genuine bicycle-desert (nothing within 25 miles) get no guidance toward any station, however distant. They must know to search a different location manually.
- **Follow-ups:** If user feedback indicates the no-fallback experience is a pain point (e.g. tourists passing through remote areas), a future approach could be a user-initiated "expand search" button rather than an automatic escalation.

## Notes

Prior to this change, `FALLBACK_COUNT` had just been increased from 5 to 20 in anticipation of the fallback surviving the revamp. That change was made redundant by this decision and was rolled back as part of the same removal.
