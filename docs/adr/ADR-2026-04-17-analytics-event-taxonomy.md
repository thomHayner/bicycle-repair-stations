---
id: ADR-2026-04-17-analytics-event-taxonomy
title: Extend Vercel Analytics custom events with a typed taxonomy
status: accepted
date: 2026-04-17
deciders: [thomHayner]
tags: [analytics, observability, vercel]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-17
---

## Context

The app already ships `@vercel/analytics` (mounted in `src/App.tsx`) and a
minimal `trackEvent(name, props)` helper in `src/lib/analytics.ts` that
was introduced with the unified share feature (PR #22). Only share
actions are instrumented — we have no insight into which pages users
visit, which repair-guide videos they play, whether they open map
markers, or which settings they change.

The owner wants a light layer of usage insight — "what do users click" —
without adopting a second analytics vendor. Error-path visibility is
already covered by Sentry (including Replay on exceptions), so session
replay from a product-analytics tool would be redundant.

## Decision

Extend the existing `trackEvent` helper rather than replace it, and
instrument the remaining user surfaces (guides, map, menu, settings,
donate, bug report) with a curated taxonomy of event names enumerated
as a TypeScript union `EventName` in `src/lib/analytics.ts`.

The helper is gated off in dev by default (`import.meta.env.PROD`),
with a `VITE_ANALYTICS_DEBUG=true` escape hatch for local verification.
Failures in the underlying tracker continue to be swallowed so
analytics never breaks UX.

Vercel Analytics' automatic pageview capture is left as-is — we do not
manually re-track route changes.

## Alternatives considered

- **PostHog / Mixpanel / Amplitude** — would add funnels, cohort
  retention, and session replay, but (a) Sentry already covers replay
  on errors, which is the only replay use-case stated, (b) adds a
  vendor and a cookie-policy discussion, (c) costs more to operate.
  Rejected as premature for the current scope.
- **Feature-flag SDK (Vercel Flags, GrowthBook, LaunchDarkly)** —
  initially conflated with "flags" in conversation. User clarified
  they wanted insight, not runtime toggles. Dropped from scope.
- **Per-event typed props map (`EventMap<E, Props>`)** — considered
  but rejected to avoid breaking the existing `trackEvent(name, props)`
  call sites from PR #22. The `EventName` union gives
  autocomplete and a canonical list without forcing prop validation.

## Consequences

- **Positive:**
  - One grep target (`EventName` in `src/lib/analytics.ts`) for the
    full event vocabulary — prevents drift and dashboard noise.
  - No new dependencies, no new vendor, no cookie banner (Vercel
    Analytics is cookieless).
  - Dev-mode gating keeps the Vercel dashboard free of local noise.
- **Negative:**
  - Prop schemas per event are documented only via usage; a regression
    that passes wrong prop shapes won't be caught at compile time.
  - Vercel Analytics has lower-ceiling querying than dedicated product
    analytics — no funnels, no retention cohorts. We accept this.
- **Follow-ups:**
  - Revisit if the owner wants funnel analysis (e.g., "search → marker
    open → directions click" conversion).
  - If instrumentation starts touching PII, tighten `trackEvent` to
    validate via a per-event prop map.

## Notes

**PII policy for this taxonomy:**
- Search queries are never sent — only `query_length`.
- OSM node IDs (`station_id`) are considered non-PII and are sent.
- External-link tracking sends only the hostname via `hostnameOf()`,
  never the full URL (avoids accidentally capturing querystrings).
- Theme / unit / locale changes log old and new values only.

**Event names** (snake_case, grouped by surface):

- Guides: `guide_video_click`, `guide_series_click`, `guide_footer_link_click`
- Map/toolbar: `locate_me_click`, `search_submit`, `layer_change`, `marker_open`, `popup_directions_click`
- Menu: `menu_open`, `menu_nav_click`, `external_link_click`
- Settings: `theme_change`, `unit_change`, `locale_change`
- Donate: `donate_cta_click`, `donate_success_view`
- Bug report: `report_bug_submit`
- Share (pre-existing, unchanged): `share_opened`, `share_native_*`, `share_channel_clicked`, `share_copy_link`

**Dashboard setup:** nothing to configure on Vercel's side — custom
events surface automatically in the Web Analytics project once the
first event fires in production.
