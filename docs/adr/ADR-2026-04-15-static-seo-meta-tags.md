---
id: ADR-2026-04-15-static-seo-meta-tags
title: Use static meta tags in index.html rather than a head-management library
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [seo, frontend, dependencies]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 seo setup
---

## Context

The app needed Open Graph, Twitter Card, and canonical tags added for
SEO. The standard React approach is to use a head-management library
(react-helmet, react-helmet-async, or the newer `<head>` support in
React 19 / react-router v7) so that individual routes can declare
their own `<title>` and `<meta>` tags.

The question was whether this app warranted that machinery.

## Decision

We use static `<meta>` tags written directly into `index.html`. No
head-management library is added as a dependency.

## Alternatives considered

- **react-helmet / react-helmet-async** — adds a runtime dependency
  and per-component `<Helmet>` wrappers in every page that wants
  custom metadata. Rejected because the app has no per-route metadata
  differentiation: all routes render as overlays on top of the always-
  mounted `MapPage`, and the meaningful content (the map itself) is
  not represented in any route URL. A single shared title and
  description is correct and sufficient.

- **React 19 / react-router v7 native `<head>` exports** — react-
  router v7 supports a `meta()` export on route modules, but only in
  framework mode (with SSR or pre-rendering). This project uses
  react-router v7 in library mode (client-side SPA); the feature is
  not available.

## Consequences

- **Positive:** Zero additional dependencies; no runtime overhead;
  trivial to audit (one file).
- **Negative:** If a future route ever needs a distinct title or
  description (e.g. a `/guides/how-to-fix-a-flat` sub-route with its
  own canonical URL), static tags cannot serve it. That would require
  revisiting this decision and adding a head-management solution.
- **Follow-ups:** If the app grows to include deep-linked content
  pages with meaningful per-route metadata, revisit and supersede this
  ADR. At that point react-helmet-async or react-router v7 framework
  mode would both be reasonable paths.

## Notes

Changes made in this session:
- `index.html` — added canonical `<link>`, Open Graph `<meta>`
  block, and Twitter Card `<meta>` block immediately after the
  existing `<meta name="description">` tag.
- `public/robots.txt` — created; allows all crawlers, references
  sitemap.
- `public/sitemap.xml` — created; lists `/`, `/guides`, `/about`,
  `/donate`. `/report-bug` is intentionally excluded (utility page,
  not indexable content).
