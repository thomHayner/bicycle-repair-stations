---
id: ADR-2026-04-17-adopt-sentry-replay-performance
title: Adopt Sentry with Session Replay and Performance monitoring
status: proposed
date: 2026-04-17
deciders: ["Thom Hayner"]
tags: [observability, monitoring, sentry, performance, a11y]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-17 sentry-vs-flags-discussion
---

## Context

A user overseas recorded a Vercel Analytics user-experience score of
26 on a recent session. The score is alarming, but there is no way
from the existing telemetry to tell whether the cause was our React
code, the user's network, the Overpass API being slow or erroring,
tile-server latency, geolocation failure, or something else entirely.

Vercel Analytics gives us aggregate Web Vitals but no per-session
detail, no stack traces for JS errors, and no visibility into the
network calls a given user made. The app's core user journey depends
on three external systems with known variability — Overpass mirrors
(documented retry behavior in `src/lib/overpass.ts`), Nominatim
geocoding, and OSM tile providers — and we currently cannot
distinguish "our bug" from "upstream was slow for this user in this
region" when a bad session is reported.

We considered whether feature flags (Vercel Flags, LaunchDarkly) would
help. They would not: flags are a deployment-control tool (kill
switches, rollouts, A/B tests), not an observability tool. The
question "why did this specific user have a bad experience" is
answered by error tracking, performance traces, and session replay —
not by flag evaluations.

## Decision

Adopt Sentry for the client bundle with three integrations enabled:

1. **Error tracking** — unhandled exceptions and promise rejections,
   with source maps uploaded at build time so stack traces map to
   TypeScript.
2. **Performance monitoring** — Web Vitals (LCP, INP, CLS) tagged
   with route, locale, and country, plus tracing for the Overpass,
   Nominatim, and tile fetch calls so upstream latency is
   distinguishable from client render cost.
3. **Session Replay** — sampled at a low rate for normal sessions
   and at 100% for sessions with errors, so the next low-UX-score
   report can be reproduced by watching the session rather than
   guessed at.

Sentry is initialized in `src/main.tsx` before the React tree mounts.
PII scrubbing is enabled; text and input masking in Replay is left at
the default (masked) to avoid capturing anything sensitive in the
share-link or report-bug flows.

Feature flags are **out of scope** for this decision. If flags are
introduced later for a separate reason, Sentry's flag-evaluation
integration can be added then.

## Alternatives considered

- **Do nothing; rely on Vercel Analytics alone** — rejected: the
  current score-of-26 incident is exactly the kind of question
  Analytics cannot answer. Without replay and stack traces we will
  keep guessing.
- **Add feature flags and use flag-evaluation telemetry to trace
  behavior** — rejected: flags are not an observability tool. Adding
  them to "trace user behavior" conflates rollout control with
  monitoring and produces neither well.
- **LogRocket / FullStory / Datadog RUM** — rejected: Sentry covers
  errors + performance + replay in one SDK, has a generous free tier
  suitable for a hobby-scale app, and is the most common pairing
  with Vercel deployments. The other tools are stronger on product
  analytics, which is not what we need here.
- **Product analytics (PostHog, Plausible custom events) instead** —
  rejected for this decision: those answer "what are users doing"
  (a worthwhile later question) but not "why did this session fail"
  (the current question). May be added separately.
- **Self-hosted Sentry** — rejected: operational cost not justified
  for a single-maintainer project.

## Consequences

- **Positive:** the next bad-UX-score report is debuggable — replay
  the session, see the stack trace, see which upstream call was
  slow. Errors previously invisible to us (caught-and-swallowed
  cache writes, rejected geolocation prompts, Leaflet edge cases)
  become visible. Performance regressions show up per-route and
  per-region, which matters for an app with 88 locales and global
  reach.
- **Negative:** adds a third-party SDK to the client bundle (~40 KB
  gzipped for errors + perf, ~70 KB with Replay lazy-loaded);
  introduces a new env var (`VITE_SENTRY_DSN`) and a source-map
  upload step in the Vercel build; Replay has privacy implications
  that must be reviewed against the existing privacy posture before
  enabling in production.
- **Follow-ups:**
  - Decide Replay sampling rates (proposed: 1% of normal sessions,
    100% of sessions with an error).
  - Confirm PII scrubbing covers the share-link query params and
    the report-bug form fields.
  - Update `docs/` (or create a `docs/observability.md`) describing
    how to triage a Sentry issue and how to read a Replay.
  - Update the privacy page copy if Replay meaningfully changes what
    we collect.
  - Revisit product analytics (PostHog custom events) as a separate
    decision once Sentry is bedded in.

## Notes

Motivating session: a user overseas with a UX score of 26 in Vercel
Analytics. The inability to attribute the score to a cause — our code
vs. Overpass vs. network vs. geolocation — is the concrete gap this
ADR closes.

Sentry has a feature-flag integration that attaches flag values to
error events. It is deliberately not adopted here; it becomes
relevant only if flags are introduced for an independent reason
(gradual rollout, kill switch, experiment). Adding flags purely to
feed Sentry would be cargo-culting.
