# CLAUDE.md — Project Guide for AI Agents

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run test         # vitest run (unit tests)
npm run test:watch   # vitest (watch mode)
npm run test:e2e     # playwright test
npm run test:e2e:ui  # playwright test --ui
```

## Branching & base-branch defaults

`dev` is the integration branch. When the user asks for a new branch or a new PR without specifying a base:

- **Branch from `dev`.** `git checkout dev && git pull && git checkout -b <new-branch>` — not from `main`, not from whatever branch happens to be checked out.
- **Target `dev` for PRs.** Pass `--base dev` to `gh pr create`. Only target `main` when the user explicitly says so (e.g. "PR into main", "release PR", "promote to main").
- `main` is reserved for release promotion from `dev`; treat it as protected.
- `dev` is branch-protected on GitHub (no deletions, no force-push, admin-enforced). Do not attempt to delete or force-push it.

This overrides the generic "Main branch (you will usually use this for PRs): main" hint that may appear in the session's `gitStatus` preamble.

## Commit & PR conventions

All commits **and PR titles** must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). The full spec, allowed types, and recommended scopes live in [`CONTRIBUTING.md#commit-messages`](CONTRIBUTING.md#commit-messages) — read it before authoring a commit or PR.

Quick form: `<type>(<scope>)!: <subject>` where:
- `<type>` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- `<scope>` is optional; prefer one of the curated scopes (`i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`)
- subject is imperative, lowercase, no trailing period, header ≤ 72 chars

A `husky` `commit-msg` hook runs `commitlint` locally and CI re-validates every commit + the PR title. Bad messages will be rejected — write conformant ones from the start rather than relying on `--amend` later.

When generating a PR description, **pre-fill `.github/pull_request_template.md` exactly** — write the Summary and Test plan from the diff, leave the checklists in place with boxes unchecked for the author/reviewer to verify.

## Architecture

React 19 + TypeScript app for finding bicycle repair stations, built with Vite and deployed on Vercel.

- **Map**: Leaflet + react-leaflet + react-leaflet-cluster
- **Routing**: react-router-dom v7, all pages lazy-loaded except MapPage
- **i18n**: i18next with 88 locales, 9 namespaces. English bundled statically; all others fetched from `/public/locales/{lng}/{ns}.json` via HTTP backend. RTL support for Arabic, Farsi, Urdu, Hebrew, Pashto, Dhivehi.
- **Styling**: Material Design 3 + Tailwind CSS 4. Use `var(--color-*)` CSS tokens for all theme-aware colors — never raw Tailwind color classes like `bg-green-600` (they won't adapt to dark mode).
- **Tests**: Vitest + Testing Library (unit), Playwright (E2E)

`MapPage` is **always mounted** — it is never unmounted on navigation. Other pages render in a portal over the map.

## i18n Namespaces

`common`, `map`, `menu`, `share`, `about`, `legal`, `donate`, `guides`, `reportBug`

All user-visible strings in TSX must use `useTranslation("namespace")` + `t("key")`. Never hardcode English in TSX files. Namespace is declared once in `useTranslation("ns")`, then `t("key")` without prefix — or `t("ns:key")` when referencing a different namespace.

## localStorage Caches

Three independent caches with separate keys:

| Cache | Key | TTL/Eviction | Module |
|---|---|---|---|
| Stations | `brs_v3` | 24 hours | `src/lib/stationCache.ts` |
| Geocode | `brs_geocode` | 50-entry LRU | `src/components/Toolbar/Toolbar.tsx` |
| Settings | `brs-theme`, `brs-unit`, `brs-locale` | Permanent | `src/context/SettingsContext.tsx` |

Cache writes silently swallow errors (localStorage may be unavailable or full — intentional).

## Code Style Conventions

- **Named exports** for all components (`export function Foo`) except `MapPage` (default-exported for lazy loading)
- **`memo(function ComponentName(...))`** for performance-critical leaf components (StationMarker, MapView, etc.)
- **Event handlers**: `onXxx` for prop names, `handleXxx` for local handler variables
- **Unused vars**: prefix with `_` to silence ESLint (configured in `eslint.config.js`)
- **No prop-drilling**: thread data through `SettingsContext` or `ShareContext` rather than passing through intermediate components

## StationQueryState Shape

New async operations should follow this discriminated union pattern:

```ts
type StationQueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; stations: OverpassNode[] }
  | { status: "none" }        // request succeeded but returned zero results
  | { status: "error"; message: string };

type StationQueryResult = StationQueryState & { retry: () => void };
```

## Overpass API

- Primary endpoint: `VITE_OVERPASS_ENDPOINT` env var (default: `https://overpass-api.de/api/interpreter`)
- Two fallback mirrors defined in `src/lib/overpass.ts`
- Retryable status codes: 429, 502, 503, 504, `TypeError` (network error), Overpass server timeout
- `fetchStations(lat, lon, radiusKm, endpoint, signal?, timeoutS?)` — positional args, do not reorder

## Intentional Patterns — Do Not Flag

These look unusual but are correct and deliberate:

**"Adjust state during render"** (`useStationQuery.ts`) — `setPrevCoords` called during render, not in a `useEffect`. This is per React docs; it eliminates the stale-frame flash that would occur if the state update were deferred. The pattern is commented.

**`programmaticMoveRef` counter** (`MapPage.tsx`) — A ref counter distinguishing user-initiated from programmatic Leaflet map movements. Must be incremented before calling `flyTo`/`fitBounds` and decremented by `moveend`. Always use the `programmaticFlyTo`/`programmaticFitBounds` helper functions rather than calling `mapRef.current.flyTo` directly.

**`eslint-disable @typescript-eslint/no-explicit-any`** with explanatory comments — Leaflet internals (`_map`, `_openPopup`) have no typed public API; `any` is unavoidable here.

**`eslint-disable react-hooks/exhaustive-deps`** with explanatory comments — one-time latching patterns that would infinite-loop if the dep array were "corrected."

**`ErrorBoundary.tsx` hardcoded English** — Cannot use React hooks (`useTranslation`) in a class component error boundary. Intentional limitation.

**`StationMarker` fallback `"Bicycle repair station"` string** — Utility/lib code outside TSX cannot call `useTranslation`; this string cannot be localized without significant refactoring.

**English hardcoded in the language-picker UI itself** — Intentional baseline; these strings must be readable before any locale is loaded.

**Accessibility text in `L.divIcon` HTML strings** (`leafletConfig.ts`) — Screen-reader labels inside `divIcon` are plain strings in a `.ts` file; i18next cannot process them. Any labels added here will remain English for all 88 locales. Document this with a comment.

## Testing Patterns

**Unit tests** — colocated with source (`ErrorBoundary.test.tsx` next to `ErrorBoundary.tsx`):
- `describe` / `it` / `expect` / `vi.fn()` / `vi.spyOn()`
- `render()` / `screen.getByRole()` / `fireEvent` from Testing Library
- `vi.restoreAllMocks()` in `afterEach`
- `localStorage.clear()` in `beforeEach` and `afterEach` when testing cache logic

**E2E tests** — in `e2e/`:
- `mockApis(page)` fixture mocks `/api/geo` and the Overpass endpoint
- `waitForOverlayGone(page)` before asserting map content
- Prefer `page.getByRole()` and `page.getByText()` over CSS selectors

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_OVERPASS_ENDPOINT` | Primary Overpass API URL | `https://overpass-api.de/api/interpreter` |
| `VITE_FALLBACK_LAT` | Last-resort latitude if geolocation fails | `40.015` (Boulder, CO) |
| `VITE_FALLBACK_LNG` | Last-resort longitude if geolocation fails | `-105.2705` |

See `.env.example` for the full list.

## Documentation conventions

- **`docs/`** — human-authored documentation. Add topic files here as
  they gain real content (e.g., `docs/architecture.md`), not
  speculatively.
- **`docs/adr/`** — Architecture Decision Records. One file per
  decision, markdown with YAML frontmatter. Date-based slugs
  (`ADR-YYYY-MM-DD-kebab-case-slug.md`) rather than sequential
  numbers, to avoid collisions across parallel sessions. See
  [`docs/adr/README.md`](docs/adr/README.md) and copy
  [`docs/adr/TEMPLATE.md`](docs/adr/TEMPLATE.md) to start a new one.
  When a non-trivial decision is made in a session, write an ADR
  alongside the code change.

## LLM-Wiki (`wiki/`)

This repo uses the Karpathy LLM-Wiki pattern as a persistent, LLM-maintained knowledge base. `wiki/` is an LLM-owned synthesis layer that sits between you and the raw sources: instead of re-deriving knowledge via ad-hoc RAG on every question, the LLM compiles it into interlinked markdown pages that compound over time. **Humans read `wiki/`; the LLM writes it.** See [`wiki/README.md`](wiki/README.md) for human-facing orientation. The rules below are the operating schema — follow them when ingesting, querying, or linting the wiki.

### Source layers

The wiki synthesizes from, but does **not** modify, these sources:

- `docs/` — project documentation, technical specifications, operational guides.
- `docs/adr/` — architectural decision records. Treat each ADR as the authoritative record of a past decision; the wiki summarizes and cross-references, but the ADR itself is canon.
- Git history — commit messages and merged PRs. Use `gh pr list --state merged --limit N`, `gh pr view <n>`, and `git log --oneline` for PR and commit context.
- `README.md`, `CONTRIBUTING.md`, and other top-level project guides.
- Any additional sources the user adds over time (meeting transcripts, external articles, design notes) — treat them the same way.

### Wiki structure

- `wiki/pages/*.md` — synthesized pages. Flat layout; introduce subcategories only when the flat layout genuinely stops scaling (typically past ~100 pages).
- `wiki/index.md` — content-oriented catalog. Update on every ingest. Start here when answering a query — it's faster than scanning `pages/` directly.
- `wiki/log.md` — chronological, append-only record of ingests, queries, lint passes, and manual edits. Each entry prefixed with `## [YYYY-MM-DD] <op> | <subject>` so the log is grep-able.
- `wiki/README.md` — human-facing entry point. Don't rewrite during routine operations.

### Page conventions

Every page under `wiki/pages/` has YAML frontmatter:

```yaml
---
title: <human-readable title>
type: <source | entity | concept | feature | decision | analysis>
sources: [<paths, PR numbers, ADR ids, URLs>]
updated: YYYY-MM-DD
---
```

- **title** — set explicitly; not derived from the filename.
- **type** — one of the categories in `index.md`. Adding a new type is fine — just add a matching section to the index.
- **sources** — every substantive claim on the page must trace back to at least one item in this list. If a claim has no source, either drop it or mark it clearly as synthesis/inference in the prose.
- **updated** — the date of the most recent substantive revision. Bump it whenever the page changes.

**Filenames** are kebab-case, short, and describe the subject: `overpass-caching.md`, `i18n-namespaces.md`, `pr-142-lazy-route-loading.md`. Not `notes.md` or `stuff-about-auth.md`.

**Internal links** use markdown relative links from the linking page: `[the Overpass cache](./overpass-caching.md)`. Keep them bidirectional where it aids navigation — if A references B, mention A somewhere on B.

**Splitting.** When a page passes ~400 lines, consider splitting by subtopic. One focused page is more maintainable than one sprawling one.

### Operations

#### Ingest

When the user asks to ingest a source:

1. **Read the source completely.** Skimming produces shallow summaries that pollute the wiki. If the source is long, read it in full — that's the point.
2. **Discuss key takeaways briefly with the user** before writing. Confirm what matters; this is cheaper than rewriting a page after filing.
3. **Create a source summary page** under `wiki/pages/` if one doesn't exist. Filename based on the source: `adr-2026-04-01-switch-to-vitest.md`, `pr-142-lazy-route-loading.md`, `spec-checkout-v2.md`.
4. **Identify every existing page the source affects.** Update each in place — add new cross-references, revise claims, flag contradictions with existing content instead of silently overwriting. A single ingest routinely touches 5–15 pages; that's normal, not excessive.
5. **Create new entity/concept pages** for anything the source mentions that deserves its own page but doesn't have one yet.
6. **Update `wiki/index.md`** — add the new pages, update titles if they changed, verify the category sections still make sense.
7. **Append to `wiki/log.md`:**

```
## [YYYY-MM-DD] ingest | <source subject>

- Source: <path / PR number / ADR id / URL>
- Pages created: <list>
- Pages updated: <list>
- Notes: <one or two sentences on anything notable — contradictions found, questions raised, topics to revisit>
```

#### Query

When the user asks a question the wiki should help answer:

1. **Read `wiki/index.md` first.** Use it as a map to find relevant pages. This is much faster than reading `pages/` indiscriminately.
2. **Read the relevant pages.** Cite them in the answer (e.g., "per `wiki/pages/overpass-caching.md`…") so the user can verify.
3. **If the answer is novel synthesis** — a comparison, an explanation, an analysis the wiki didn't already contain — ask whether to file it as a new page. Good answers shouldn't disappear into chat history; filing them is how the wiki compounds from questions as well as ingests.
4. **If a page was created**, append to `log.md`:

```
## [YYYY-MM-DD] query | <question topic>

- Question: <one-line summary>
- Pages referenced: <list>
- Pages created: <list, if any>
```

If nothing was filed, a log entry is optional — judgment call.

#### Lint

When the user asks for a lint / health check:

- **Contradictions** — pages with conflicting claims. Flag them; don't silently resolve. The user decides which is correct.
- **Stale claims** — statements superseded by newer sources. Flag with the superseding source.
- **Orphan pages** — pages with no inbound links. Either link them from somewhere relevant or propose deletion.
- **Missing pages** — concepts or entities mentioned on multiple pages but lacking their own. Propose creation.
- **Source drift** — pages whose `sources:` frontmatter references files that have been deleted or heavily rewritten. Flag for re-ingestion.

Produce a triage list, not autonomous edits. The user approves before anything changes. Append to `log.md`:

```
## [YYYY-MM-DD] lint | <what was checked>

- Issues found: <count>
- Resolved inline: <list, if any>
- Flagged for user: <list>
```

### Scope discipline

- **The wiki is LLM-owned.** A human hand-editing a wiki page must log it as `manual-edit` in `log.md` so the next ingest doesn't quietly re-diverge.
- **Sources are read-only during wiki operations.** Ingesting an ADR doesn't modify the ADR. Editing an ADR is a separate task.
- **No fabrication.** Every claim traces back to `sources:` frontmatter. If no source supports a claim, drop it or mark it as explicit synthesis.
- **When uncertain where a fact belongs**, surface the question to the user instead of forcing a bad filing. An incorrectly filed page is harder to fix than a deferred one.
- **Scaffolding is not ingestion.** Setting up `wiki/` (via the `scaffold-llm-wiki` skill) creates the structure. Populating it is a separate operation the user initiates explicitly.
