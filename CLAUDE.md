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
- **`wiki/`** — reserved for a future LLM-Wiki layer that will
  synthesize `docs/` (including ADRs) into navigable documentation.
  **Leave this folder alone for now** — do not hand-author files
  here.
