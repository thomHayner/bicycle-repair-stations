---
id: ADR-2026-04-15-distance-display-from-gps-only
title: Show distance to station only from GPS position, never from search location
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [frontend, ux, location]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-lift-user-distance-to-mappage]
source: claude-code-session-2026-04-15 marker distance and directions
---

## Context

`StationListView` previously showed a distance figure on each list card
calculated from `filterCenter` — a composite value that could be the user's
GPS position, an explicitly searched location, or the current map centre.
The intent was to show "how far is this station from where I'm looking", but
the actual user expectation (clarified in session) is different: "how far is
this station from *me*, right now". A user who searched for stations in a
different city should not see distances from that city; they should either see
distances from their GPS location or no distance at all.

Additionally, the map marker popup showed no distance at all prior to this
session.

## Decision

Distance displayed in both the station list cards and the map marker popup is
sourced exclusively from the resolved GPS position (`userPosition`, status
`"resolved"`). If the user has not shared location — or location is denied —
the distance field is hidden entirely on both surfaces. The search/filter
centre (`filterCenter`) continues to drive *sorting* of the list and the
station query radius, but it never drives the displayed distance figure.

## Alternatives considered

- **Distance from filterCenter (prior state)** — Shows distance from whatever
  the user is searching around. Rejected: conflates "search origin" with
  "my actual location", which misleads users who search away from themselves.
- **Always show distance, fall back to search origin when GPS unavailable** —
  Rejected explicitly: "search location has no effect here, never display
  distance from search location."
- **Show both distances (GPS + search origin)** — Not discussed as a serious
  alternative; adds visual noise and is confusing when they coincide.

## Consequences

- **Positive:** Distance is unambiguous — it always means "from me". Users
  who have not shared GPS see no misleading figure. Consistent on both list
  and popup surfaces.
- **Negative:** Users without GPS sharing get no distance feedback at all,
  even when the search origin would be a reasonable proxy. The Get Directions
  button remains visible regardless to compensate.
- **Follow-ups:** None discussed. The policy is intentional and explicit.

## Notes

- `filterCenter` (search/given location or map centre) is still used for
  sorting the list and for the radius filter shown in the header ("14 stations
  within 2 mi"). Only the per-station distance *label* is GPS-only.
- The Get Directions button is always visible regardless of GPS sharing status;
  this was a separate product requirement confirmed in the same session.
