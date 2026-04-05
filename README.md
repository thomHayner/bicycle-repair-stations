# BicycleRepairStations.com

[![CI](https://github.com/thomHayner/bicycle-repair-stations/actions/workflows/ci.yml/badge.svg)](https://github.com/thomHayner/bicycle-repair-stations/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A mobile-first **Progressive Web App** that helps cyclists instantly locate public bicycle repair stations near them. Station data is sourced live from [OpenStreetMap](https://www.openstreetmap.org/) via the Overpass API — no proprietary database, no user accounts, no tracking, no API keys required.

---

## Features

### Map & Station Discovery
- **Auto-locate** — requests GPS on load, centers the map and fetches stations automatically
- **Location search** — geocodes any city, address, or landmark via Nominatim and re-centers the map
- **Search this area** — floating button appears when the map drifts far from the last fetch; triggers a fresh query at the current center
- **Wide-area fallback** — if no stations exist within the primary radius, automatically searches up to 1,000 miles and shows the 5 nearest, or reports "No stations within 1,000 mi"
- **Station markers** — green markers for all in-radius stations; tap to center and open a detail popup
- **Station popup** — name, description, operator, amenity badges (Tools / Pump / Repair), opening hours, and a **Get Directions** button
- **Get Directions** — Apple Maps (cycling mode) on iOS; Google Maps (bicycling mode) everywhere else
- **Popup auto-close** — popup dismisses automatically when the user starts panning

### Station List & Filtering
- **Station list panel** — bottom sheet listing all in-radius stations sorted by distance, expandable/collapsible
- **Distance filter** — radius presets: 1, 2, 5, 10, 15, 20, 25 mi (or 1, 2, 5, 10, 20, 30, 40 km); auto-widens on zoom-out, never auto-narrows
- **Unit toggle** — switch between miles and kilometres; persisted to `localStorage`
- **Amenity filters** — AND-logic filter pills for Pump, Tools, and Repair; combinable with a single-tap Clear
- **Loading indicator** — spinner + pulse animation in the station count header while a query is in flight

### Map Controls
- **Three map layers** — Cycling (default), Satellite, Standard — selectable via a FAB picker
- **Dark mode tile inversion** — light-mode tiles inverted with a CSS filter for all non-satellite layers; no separate dark tile providers needed
- **Locate me FAB** — flies back to current GPS position at zoom 18; dimmed until GPS resolves
- **Zoom-out guard** — hides markers and shows a toast when the visible map spans more than 75 miles
- **User position marker** — blue pulsing dot with accuracy radius ring

### Navigation & Pages
- **Always-mounted map** — navigating to other pages never unmounts or reloads the map
- **Repair Guides** — curated Park Tool YouTube videos in 7 categories (Flat Tyre, Brakes, Gears, Chain, Wheels, Headset, Bottom Bracket)
- **About** — credits, contribute link, Privacy Policy, and Terms of Service with accordion expand/collapse
- **Report a bug** — in-app form that opens GitHub issues for maintainer triage
- **Menu drawer** — slide-in navigation with theme toggle (Light / Dark / System) and unit toggle

### PWA & Accessibility
- **PWA installable** — `manifest.json` with standalone display; 192 × 192 and 512 × 512 icons
- **Offline tile caching** — Workbox CacheFirst strategy, 7-day TTL, 500 tile cap
- **Dark mode** — class-based Tailwind dark mode following system preference; overridable to Light or Dark
- **WCAG AA contrast** — all text/background combinations verified; primary interactive elements meet AAA (7 : 1)
- **Touch targets** — all buttons and links ≥ 44 × 44 px
- **Ad banner slot** — fixed 50 px bottom bar compatible with standard 320 × 50 Mobile Banner ad units

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19.x |
| Language | TypeScript | 5.9.x |
| Build tool | Vite | 8.x |
| Styling | Tailwind CSS | 4.x (Vite plugin) |
| Routing | React Router | 7.x |
| Map | Leaflet + react-leaflet | 1.9.x / 5.x |
| Map tiles | CARTO, ESRI, WaymarkedTrails | No API key required |
| Station data | Overpass API | No API key required |
| PWA | vite-plugin-pwa (Workbox) | 1.2.x |
| Analytics | Vercel Analytics + Speed Insights | 2.x |
| Linting | ESLint + typescript-eslint | 9.x / 8.x |
| Deploy | Vercel | — |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/thomHayner/bicycle-repair-stations.git
cd bicycle-repair-stations
npm install
```

### Environment setup

```bash
cp .env.example .env.local
# Edit .env.local if you want to override the Overpass endpoint or fallback coordinates
```

### Run dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and allow location access when prompted.

### Build for production

```bash
npm run build       # type-check + Vite bundle
npm run preview     # serve the dist/ folder locally
```

### Lint

```bash
npm run lint
```

---

## Environment Variables

All variables are optional — sensible defaults are built in.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OVERPASS_ENDPOINT` | `https://overpass-api.de/api/interpreter` | Primary Overpass API URL. Override with a mirror if rate-limited. |

Server-side variables for bug issue creation (`/api/report-bug`):

| Variable | Description |
|----------|-------------|
| `GITHUB_ISSUES_TOKEN` | Fine-grained GitHub token with Issues: Read and Write for this repo |
| `GITHUB_REPO_OWNER` | Repository owner |
| `GITHUB_REPO_NAME` | Repository name |
| `APP_ORIGINS` | Optional comma-separated origin allow-list for API requests |
| `APP_ORIGIN` | Optional legacy single-origin setting |

These must be configured in your hosting provider's encrypted environment settings and never exposed as `VITE_*` variables.

---

## Bug Reporting

- Users can submit bug reports from the in-app **Report a bug** page.
- Submissions create public GitHub issues via `/api/report-bug`.
- Reports should not include personal or sensitive information because issues are public.
- Minimal triage automation runs in `.github/workflows/issue-triage.yml` and adds `needs-triage` plus platform hint labels when possible.

---

## Project Structure

```
src/
├── App.tsx                          # Routes — MapPage always mounted outside <Routes>
├── main.tsx
├── index.css                        # Tailwind v4 + Leaflet overrides + CSS custom properties
├── assets/
├── components/
│   ├── AdBanner/AdBanner.tsx        # 50px bottom ad slot (320×50 banner)
│   ├── ErrorBoundary.tsx
│   ├── ErrorToast.tsx
│   ├── LoadingOverlay.tsx
│   ├── StationListView.tsx          # Bottom sheet with filters, list, and loading state
│   ├── Map/
│   │   ├── MapView.tsx              # Tile layers, dark-mode inversion, markers, event handler
│   │   ├── StationMarker.tsx
│   │   ├── StationPopup.tsx
│   │   └── UserMarker.tsx
│   ├── Menu/MenuDrawer.tsx          # Slide-in navigation + theme/unit toggles
│   └── Toolbar/
│       └── Toolbar.tsx              # Search bar, locate FAB, layer FAB, geocoding
├── context/
│   ├── SettingsContext.tsx          # Theme + unit provider (wraps app at root)
│   ├── settingsCtx.ts               # Context object definition (avoids fast-refresh issues)
│   └── useSettings.ts               # Consumer hook
├── hooks/
│   ├── useGeolocation.ts            # GPS watchPosition with denied-permission fallback
│   ├── useOverpassQuery.ts          # Primary Overpass fetch + localStorage cache
│   └── useFallbackQuery.ts          # Wide-area fallback query (up to 1,000 mi / 1,609 km)
├── lib/
│   ├── directions.ts                # Platform-aware Apple Maps / Google Maps URL builder
│   ├── distance.ts                  # Haversine distance formula + visible-width helper
│   ├── env.ts                       # VITE_ environment variable accessors with defaults
│   ├── layers.ts                    # Map tile layer ID type + LAYERS display array
│   ├── leafletConfig.ts             # Leaflet default icon fix + custom DivIcon helpers
│   ├── overpass.ts                  # Overpass query builder + fetch with mirror fallback
│   ├── stationCache.ts              # localStorage cache read/write/coverage-check logic
│   └── units.ts                     # Unit types (mi/km) + distance preset arrays
├── pages/
│   ├── AboutPage.tsx
│   ├── DonatePage.tsx
│   ├── GuidesPage.tsx
│   ├── MapPage.tsx                  # Root page — always mounted, never unmounted
│   └── ReportBugPage.tsx
└── types/
    └── overpass.ts                  # OverpassNode + OverpassResponse TypeScript interfaces
```

---

## Deployment

The project deploys to **Vercel** via the native GitHub integration. Every push to `main` automatically triggers a production build and deployment — no CLI tokens or manual steps required.

**One-time setup** (already done for this repo):
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo
2. Vercel auto-detects Vite — no framework configuration needed
3. Optionally add `VITE_*` environment variables under **Project Settings → Environment Variables**

The `vercel.json` at the project root configures the SPA rewrite (`/* → /index.html`) and a `Referrer-Policy: strict-origin-when-cross-origin` security header.
This is intentional: unknown routes are served the app shell (not a separate server 404 page) so the map experience remains the default catch-all entry.

---

## CI / CD

Every push and pull request runs the **Lint & Build** GitHub Actions workflow (`.github/workflows/ci.yml`):

1. Install dependencies (`npm ci`)
2. Lint (`eslint .`)
3. Production build (`tsc -b && vite build`)
4. Upload the `dist/` folder as a workflow artifact (1-day retention)

The `Lint & Build` check is required to pass before a PR can merge to `main`. Deployment is handled entirely by Vercel's GitHub integration — there is no deploy step in the CI workflow and no Vercel tokens stored in GitHub secrets.

---

## Architecture Notes

### Leaflet + React

Leaflet is an imperative DOM library; `react-leaflet` wraps it in React context. Key conventions in this codebase:

- `MapContainer` is never unmounted (avoids expensive Leaflet re-initialisation)
- `MapPage` is rendered **outside** `<Routes>` so page navigation never triggers an unmount
- Map events (`dragstart`, `moveend`, `zoomend`) are handled via a `MapEventHandler` child component using `useMapEvents`
- The map `ref` is held at `MapPage` level so the Toolbar's re-center button can call `map.flyTo()` without prop-drilling through unrelated components

### Overpass API

- Queries use `POST` with `application/x-www-form-urlencoded` (correct per Overpass documentation)
- The primary radius is **65 km** — large enough that the cache remains valid until the user moves more than ~24.7 km from the last fetch centre
- Results are written to `localStorage` (`brs_v2` key) with a 24-hour TTL; a new fetch only fires when the user is outside the covered area
- If the primary query returns zero stations, `useFallbackQuery` fires a **1,609 km / 60-second** Overpass query, sorts by distance, and surfaces the 5 nearest
- Three Overpass mirrors are tried in sequence on HTTP 429 / 5xx errors

### Dark Mode Tile Inversion

Rather than maintaining separate tile URLs for each dark-mode variant, the app applies a single CSS filter to the Leaflet tile pane:

```css
.map-dark-tiles .leaflet-tile-pane {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
```

The `.map-dark-tiles` class is added to the map container by `MapView` whenever `resolvedTheme === "dark"` and the active layer is not `satellite`. Satellite imagery is excluded from inversion — its natural colours are more useful than the false-colour result of inverting aerial photography. Markers, popups, and all other UI elements live outside `.leaflet-tile-pane` and are unaffected.

### PWA / Offline

- The **app shell** (all JS, CSS, HTML, icons) is precached by Workbox on service worker install
- **Map tiles** are cached with a `CacheFirst` strategy (7-day TTL, max 500 entries) — any tile the user has previously viewed is available offline
- The service worker auto-updates on new deploy (`registerType: "autoUpdate"`)

---

## Data Source

Station data comes from OpenStreetMap contributors under the [ODbL 1.0](https://www.openstreetmap.org/copyright) licence. If a station near you is missing, you can add it at [openstreetmap.org/edit](https://www.openstreetmap.org/edit) using the tag `amenity=bicycle_repair_station` — it will appear in the app within approximately 24 hours.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, code style guide, and how to open issues or pull requests. The easiest contribution requires no code at all — just add a missing station directly on OpenStreetMap.

---

## License

[MIT](LICENSE) © thomHayner

---

---

# Technical Reference

> Combined reference document: Project Charter · Features · User Stories · Technical Specification · Data & API Specification · Development Notes
>
> Last updated: March 2026

---

## Table of Contents

1. [Project Charter](#1-project-charter)
2. [Features](#2-features)
3. [User Stories](#3-user-stories)
4. [Technical Specification](#4-technical-specification)
5. [Data & API Specification](#5-data--api-specification)
6. [Development Plan & Architecture Notes](#6-development-plan--architecture-notes)

---

## 1. Project Charter

### 1.1 Project Name
**BicycleRepairStations.com**

### 1.2 Purpose
A free, open-source, mobile-first Progressive Web App (PWA) that helps cyclists instantly locate public bicycle repair stations near them. Station data is sourced exclusively from OpenStreetMap via the Overpass API — no proprietary database, no user accounts, no tracking.

### 1.3 Goals
- Provide the fastest possible path from "I need to fix my bike" to "here is the nearest repair station."
- Require zero sign-up, zero data collection, and work offline after first load (PWA).
- Be fully accessible (WCAG AA minimum, AAA where practical) and usable on any modern mobile browser.
- Remain free to use; sustain hosting costs through a non-intrusive bottom banner ad slot.

### 1.4 Non-Goals
- Real-time station availability or crowdsourced condition reports.
- User accounts, saved favourites, or trip history.
- Selling or storing any user data.
- Native iOS / Android app distribution (PWA install covers this use case).

### 1.5 Target Users
Cyclists who are on the road, have a mechanical issue, and need a public repair station quickly. Primary device: smartphone (any modern iOS or Android browser). Secondary: desktop browsers for trip planning.

### 1.6 Success Criteria
- A user can open the site, see their nearest stations, and tap "Get Directions" in under 10 seconds on a 4G connection.
- The app is installable on a home screen and loads a cached view offline.
- All visible text meets WCAG AA contrast ratios; interactive targets meet WCAG 44 × 44 px minimum.

---

## 2. Features

### 2.1 Core Map & Station Discovery

| # | Feature | Notes |
|---|---------|-------|
| F-01 | **Auto-locate** | On load, requests GPS via `watchPosition`. Centers map and fetches stations automatically. Falls back to London (51.505, −0.09) if permission is denied. |
| F-02 | **Location search** | Geocodes free-text input via Nominatim and re-centers the map. Shows inline error if location not found. |
| F-03 | **Search this area** | Floating button appears when the map center drifts far from the last fetch anchor; triggers a fresh Overpass query at the current map center. |
| F-04 | **Overpass station fetch** | Queries `amenity=bicycle_repair_station` nodes within a 65 km radius. Results cached in `localStorage` for 24 hours; re-fetched only when the user moves outside the covered area. |
| F-05 | **Wide-area fallback** | If the primary 65 km fetch returns zero results, automatically searches up to **1,000 miles (1,609 km)**. Shows the 5 nearest stations and updates the "within X mi" display to the farthest distance, or shows "No stations within 1,000 mi" if nothing is found. |
| F-06 | **Station markers** | Green map markers for all stations within the active radius. Tapping a marker centers the map (no zoom change) and opens a popup. |
| F-07 | **Station popup** | Shows station name, description, operator, amenity badges (Tools / Pump / Repair), opening hours, and a **Get Directions** button. |
| F-08 | **Get Directions** | Platform-aware: Apple Maps (cycling mode) on iOS; Google Maps (bicycling mode) on all other platforms. Opens in the native maps app if installed. |
| F-09 | **Popup auto-close on drag** | Leaflet popup closes when the user begins dragging the map. |

### 2.2 Station List & Filtering

| # | Feature | Notes |
|---|---------|-------|
| F-10 | **Station list panel** | Bottom sheet showing all stations within the selected radius, sorted by distance. Expandable/collapsible. |
| F-11 | **Distance filter** | Preset radius pills: 1, 2, 5, 10, 15, 20, 25 mi (or 1, 2, 5, 10, 20, 30, 40 km). Auto-increases as the user zooms out; never auto-decreases. |
| F-12 | **Unit toggle** | Switch between miles and kilometres. Persisted in `localStorage`. |
| F-13 | **Amenity filters** | AND-logic filter buttons for Pump, Tools, and Repair service tags. Can be combined. "Clear" resets all. |
| F-14 | **Loading state** | While a query is in flight, the list header shows a spinner and the station count pulses. When zero results are found yet, shows "Searching nearby…". |

### 2.3 Map Controls

| # | Feature | Notes |
|---|---------|-------|
| F-15 | **Map layers** | Three tile layer options accessible via a FAB picker: **Cycling** (default — CARTO Positron + WaymarkedTrails cycling & MTB overlays), **Satellite** (ESRI World Imagery + CARTO labels overlay), **Standard** (CARTO Voyager). Dark mode applies a CSS filter inversion to all non-satellite layers automatically. |
| F-16 | **Locate me FAB** | Re-centers map on the user's current GPS position at zoom 18. Disabled (visually dimmed) until GPS resolves. |
| F-17 | **Zoom-out guard** | If the visible map width exceeds 75 miles, station markers are hidden and a "Zoom in to see repair stations" toast is shown. |
| F-18 | **User position marker** | Blue pulsing dot with accuracy radius ring. |

### 2.4 Navigation & Pages

| # | Feature | Notes |
|---|---------|-------|
| F-19 | **Always-mounted map** | `MapPage` renders unconditionally outside `<Routes>`. Navigating to overlay pages never unmounts or reloads the map. |
| F-20 | **Repair Guides** | Curated Park Tool YouTube video library organised into 7 categories (Flat Tyre, Brakes, Gears, Chain, Wheels, Headset, Bottom Bracket). Thumbnails from YouTube's image CDN; tapping opens YouTube. |
| F-21 | **About** | Credits (OpenStreetMap, Leaflet, CARTO, Overpass API), Contribute link, Privacy Policy, and Terms of Service — all inline with accordion expand/collapse. |
| F-22 | **Menu drawer** | Left-side slide-in drawer for page navigation, theme toggle (Light / Dark / System), and unit toggle (mi / km). |

### 2.5 PWA & Accessibility

| # | Feature | Notes |
|---|---------|-------|
| F-23 | **PWA install** | `manifest.json` with `display: standalone`, 192 × 192 and 512 × 512 icons. Workbox `generateSW` precaches all JS/CSS/HTML assets. Map tiles cached separately (CacheFirst, 7-day TTL, 500 entry cap). |
| F-24 | **Dark mode** | Class-based (`dark` on `<html>`). Follows system preference by default; overridable to Light or Dark. All colour tokens defined in CSS custom properties. Non-satellite map tiles are inverted via a single CSS filter rule — no separate dark tile providers needed. |
| F-25 | **WCAG contrast** | All text/background combinations meet WCAG AA (4.5 : 1 normal text, 3 : 1 large / UI). Primary interactive elements meet AAA (7 : 1). |
| F-26 | **Touch targets** | All buttons and links ≥ 44 × 44 px. |
| F-27 | **Ad banner slot** | Fixed 50 px bottom bar reserved for a 320 × 50 Mobile Banner ad unit (Google AdSense compatible). |

---

## 3. User Stories

### 3.1 Station Discovery

**US-01 — Find stations near me**
> As a cyclist with a flat tyre, I want the app to immediately show me the nearest repair stations so I can get back on the road without wasting time searching.

*Acceptance criteria:* On first load with location permission granted, the map centers on the user's position and stations within the default radius appear within one Overpass round-trip. No manual input required.

---

**US-02 — Search a specific location**
> As a user planning a ride, I want to type a city, address, or landmark into the search bar and see stations near that place.

*Acceptance criteria:* Entering a location and tapping Search geocodes the input via Nominatim, flies the map to that location, and triggers a fresh station fetch. If geocoding fails, an inline error is shown.

---

**US-03 — Find stations in a remote area**
> As a cyclist in a rural area, I want to be told about the nearest stations even if none exist within the normal 25-mile radius, so I know where to head rather than assuming the app is broken.

*Acceptance criteria:* When the primary query returns 0 results, the list automatically shows "Searching nearby…" with a spinner, then either lists the 5 nearest stations within 1,000 miles (with the radius display updated to the farthest station's distance) or shows "No stations within 1,000 mi".

---

**US-04 — Get directions to a station**
> As a cyclist, I want tapping "Get Directions" to open my phone's native maps app in cycling mode, so I get turn-by-turn navigation without switching apps manually.

*Acceptance criteria:* On iOS, the link opens Apple Maps with `dirflg=b` (cycling). On Android/desktop, it opens Google Maps with `travelmode=bicycling`. Both open the installed native app if available.

---

### 3.2 Map Interaction

**US-05 — Tap a marker to see station details**
> As a map user, I want tapping a station marker to center the map on that station and show me its details without zooming in or out, so I keep my current context.

*Acceptance criteria:* Tapping a marker calls `map.flyTo` at the current zoom level (no zoom change) with a smooth 0.8 s animation. A popup opens showing the station's name, amenities, and directions button. `autoPan` is disabled to prevent double-pan jitter.

---

**US-06 — Dismiss a popup by dragging**
> As a map user, I want the popup to close when I start dragging the map so it doesn't obscure my view while panning.

*Acceptance criteria:* The Leaflet `dragstart` event calls `map.closePopup()` before the existing map interaction handler.

---

**US-07 — Navigate to a page and return without the map reloading**
> As a user, I want to browse Repair Guides and come back to the map without seeing the map reinitialise, so my current position and open station are preserved.

*Acceptance criteria:* `MapPage` is rendered outside `<Routes>` and is never unmounted. Overlay pages (`/guides`, `/settings`, `/about`) are `fixed inset-0 z-[2000]` panels that cover the map without unmounting it.

---

**US-08 — Switch map style**
> As a user, I want to switch between a cycling-focused map, satellite imagery, and a standard street map so I can choose the best context for my ride.

*Acceptance criteria:* The layer FAB opens a picker with three options. The selected layer persists for the session. Dark mode is applied automatically via tile filter inversion for non-satellite layers.

---

### 3.3 Filtering & Distance

**US-09 — Filter by amenity type**
> As a cyclist with a specific need (e.g. I only need a pump), I want to filter the station list to show only stations with the equipment I need.

*Acceptance criteria:* Three toggle buttons — Pump, Tools, Repair — apply AND logic to the station list. A "Clear" button resets all filters.

---

**US-10 — Adjust the search radius**
> As a user in a dense city, I want to narrow the displayed results to the closest 1–2 miles. As a user in a sparse area, I want to widen it to 25 miles.

*Acceptance criteria:* Distance pills filter the displayed list and markers. The radius auto-increases as the user zooms out but never auto-decreases. Manual selection always wins.

---

**US-11 — Use kilometres instead of miles**
> As a non-US cyclist, I want all distances shown in kilometres.

*Acceptance criteria:* The unit toggle (mi / km) is accessible from the Menu Drawer and the station list panel. Switching units converts the current distance selection to the nearest equivalent preset. The preference persists across sessions via `localStorage`.

---

### 3.4 Appearance & Accessibility

**US-12 — Use the app in dark mode**
> As a night rider, I want a dark theme that doesn't blind me when checking the map in low light.

*Acceptance criteria:* Dark mode is available as an explicit option and also follows the OS preference when set to "System". Map tiles (except satellite) are automatically inverted. All UI surfaces have verified WCAG-compliant contrast in both themes.

---

**US-13 — Use the app as a home-screen icon**
> As a frequent user, I want to install the app to my home screen so it opens full-screen like a native app.

*Acceptance criteria:* The site is a valid PWA with a `manifest.json`, service worker, and appropriate icons (192 px, 512 px). `display: standalone` removes the browser chrome when launched from the home screen.

---

### 3.5 Content

**US-14 — Watch bike repair tutorials**
> As a cyclist who wants to fix their own bike, I want access to guided repair videos I can follow step-by-step.

*Acceptance criteria:* The Repair Guides page shows Park Tool YouTube videos organised into 7 categories. Each card shows a thumbnail, title, and external link icon. Tapping opens the video on YouTube.

---

**US-15 — Add a missing station**
> As an OpenStreetMap contributor, I want a direct link to add a station that isn't in the app yet.

*Acceptance criteria:* The Menu Drawer and About page both link to `https://www.openstreetmap.org/edit` (external, opens in new tab).

---

## 4. Technical Specification

### 4.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19.x |
| Language | TypeScript | 5.9.x |
| Build tool | Vite | 8.x |
| Styling | Tailwind CSS | 4.x (Vite plugin) |
| Routing | React Router | 7.x |
| Map | Leaflet + react-leaflet | 1.9.x / 5.x |
| PWA | vite-plugin-pwa (Workbox) | 1.2.x |
| Analytics | Vercel Analytics + Speed Insights | 2.x |
| Linting | ESLint + typescript-eslint | 9.x / 8.x |

### 4.2 Project Structure

```
src/
├── App.tsx                          # Routes — MapPage always mounted outside <Routes>
├── main.tsx
├── index.css                        # Tailwind v4 + Leaflet overrides + CSS custom properties
├── assets/
├── components/
│   ├── AdBanner/AdBanner.tsx        # 50px bottom ad slot (320×50 banner)
│   ├── ErrorBoundary.tsx
│   ├── ErrorToast.tsx
│   ├── LoadingOverlay.tsx
│   ├── StationListView.tsx          # Bottom sheet with filters, list, and loading state
│   ├── Map/
│   │   ├── MapView.tsx              # Tile layers, dark-mode inversion, markers, event handler
│   │   ├── StationMarker.tsx
│   │   ├── StationPopup.tsx
│   │   └── UserMarker.tsx
│   ├── Menu/MenuDrawer.tsx          # Slide-in navigation + theme/unit toggles
│   └── Toolbar/
│       └── Toolbar.tsx              # Search bar, locate FAB, layer FAB, geocoding
├── context/
│   ├── SettingsContext.tsx          # Theme + unit provider (wraps app at root)
│   ├── settingsCtx.ts               # Context object definition (prevents fast-refresh issues)
│   └── useSettings.ts               # Consumer hook
├── hooks/
│   ├── useGeolocation.ts            # GPS watchPosition with denied-permission fallback
│   ├── useOverpassQuery.ts          # Primary Overpass fetch + localStorage cache
│   └── useFallbackQuery.ts          # Wide-area fallback query (up to 1,000 mi / 1,609 km)
├── lib/
│   ├── directions.ts                # Platform-aware Apple Maps / Google Maps URL builder
│   ├── distance.ts                  # Haversine distance formula + visible-width helper
│   ├── env.ts                       # VITE_ environment variable accessors with defaults
│   ├── layers.ts                    # Map tile layer ID type + LAYERS display array
│   ├── leafletConfig.ts             # Leaflet default icon fix + custom DivIcon helpers
│   ├── overpass.ts                  # Overpass query builder + fetch with mirror fallback
│   ├── stationCache.ts              # localStorage cache read/write/coverage-check logic
│   └── units.ts                     # Unit types (mi/km) + distance preset arrays
├── pages/
│   ├── AboutPage.tsx
│   ├── DonatePage.tsx
│   ├── GuidesPage.tsx
│   ├── MapPage.tsx                  # Root page — always mounted, never unmounted
│   └── ReportBugPage.tsx
└── types/
    └── overpass.ts                  # OverpassNode + OverpassResponse TypeScript interfaces
```

### 4.3 Routing Architecture

`MapPage` is rendered **outside** `<Routes>` so it is never unmounted during navigation. Overlay pages are rendered inside `<Routes>` as `fixed inset-0 z-[2000]` full-screen panels. When a route is active its panel covers the map; when inactive it simply does not render — the map beneath it is always live.

```tsx
// App.tsx
<SettingsProvider>
  <Analytics />
  <SpeedInsights />
  <MapPage />                       {/* Always mounted */}
  <Suspense fallback={null}>
    <Routes>
      <Route path="/guides"   element={<GuidesPage />} />
      <Route path="/about"    element={<AboutPage />} />
      <Route path="/donate"   element={<DonatePage />} />
      <Route path="/report-bug" element={<ReportBugPage />} />
    </Routes>
  </Suspense>
</SettingsProvider>
```

### 4.4 State Management

No external state library. State is colocated at the lowest necessary ancestor:

| State | Owner | Persistence |
|-------|-------|-------------|
| `theme`, `unit` | `SettingsContext` | `localStorage` |
| `givenLocation` | `MapPage` | Session |
| `selectedDist` | `MapPage` | Session |
| `activeLayer` | `MapPage` | Session |
| `selectedStationId` | `MapPage` | Session |
| `listExpanded` | `MapPage` | Session |
| Overpass result | `useOverpassQuery` | `localStorage` (24 h TTL) |
| Fallback result | `useFallbackQuery` | In-memory only |
| Active amenity filters | `StationListView` | Session |
| Search query / not-found | `Toolbar` | Session |

### 4.5 Station Data Flow

```
GPS / Search
    │
    ▼
givenLocation (MapPage state)
    │
    ▼
useOverpassQuery(lat, lng)
    ├── Cache hit? → return cached stations
    └── Cache miss → fetchStations(lat, lng, 65 km)
            │
            ▼
        allStations (OverpassNode[])
            │
            ├── length > 0 → filter by selectedDist → displayStations
            └── length = 0 → fallbackEnabled = true
                                │
                                ▼
                        useFallbackQuery(lat, lng, enabled)
                            → fetchStations(lat, lng, 1609 km, timeout=60s)
                            → sort by distance, take 5 nearest
                            → displayStations = fallback.stations
                            → selectedDist = farthestMi (in current unit)
```

### 4.6 Caching Strategy

| Cache | Key | TTL | Eviction |
|-------|-----|-----|---------|
| Station data | `brs_v2` (localStorage) | 24 hours | Timestamp check on read |
| Map tiles | Workbox `osm-tiles` | 7 days | Max 500 entries (LRU) |
| App shell (JS/CSS/HTML) | Workbox precache | Service worker update | New SW install |

Cache coverage check: a new Overpass fetch is triggered only when the user's position is more than **~24.7 km** from the last fetch centre (= 65 km fetch radius − 40.3 km max display radius).

### 4.7 Theme System

Tailwind v4 class-based dark mode (`@variant dark (&:where(.dark, .dark *))`). The `dark` class is toggled on `<html>` by `SettingsContext`. All colours are defined as CSS custom properties in `:root` and `.dark` blocks in `index.css`, ensuring consistent theming across Leaflet popups (which live outside the React tree) and Tailwind utility classes.

Map tiles in dark mode are inverted via `.map-dark-tiles .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }`. The `.map-dark-tiles` class is applied by `MapView` when the resolved theme is dark and the active layer is not `satellite`. This approach requires zero additional tile providers or API keys.

### 4.8 Directions Logic

```typescript
// iOS → Apple Maps cycling mode
`https://maps.apple.com/?daddr=${lat},${lon}&dirflg=b`

// Android / Desktop → Google Maps cycling mode
`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=bicycling`
```

Detection: `navigator.userAgent` check for `iPad|iPhone|iPod`.

### 4.9 Accessibility Standards

- **Contrast**: All text/surface combinations verified against WCAG 2.1. Light-mode uses dark text on white/near-white backgrounds. Dark-mode uses slate-400 (`#94a3b8`, 7.6 : 1) as the minimum for secondary text. Active buttons use inverted MD3 pattern in dark mode.
- **Touch targets**: Minimum 44 × 44 px on all interactive elements.
- **`:visited` link colour**: Explicitly overridden with `!important` on the Get Directions button to prevent browser UA styles from breaking contrast.
- **Semantic HTML**: `<header>`, `<nav>`, `<form>`, `<button type="button">`, `aria-label`, `aria-pressed`, `aria-expanded` used throughout.
- **Keyboard**: `closeOnEscapeKey` on Leaflet popups; focus management in the menu drawer.

---

## 5. Data & API Specification

This project is a **pure consumer** of open, unauthenticated APIs. No API keys are required and no data is sent from users to any proprietary server.

### 5.1 Overpass API — Station Data

**Purpose**: Query OpenStreetMap for `amenity=bicycle_repair_station` nodes.

**Primary endpoint**: `https://overpass-api.de/api/interpreter`

**Fallback mirrors** (tried in order on HTTP 429 / 502 / 503 / 504):
1. `https://overpass.kumi.systems/api/interpreter`
2. `https://overpass.openstreetmap.ru/api/interpreter`

**Configurable via**: `VITE_OVERPASS_ENDPOINT` environment variable.

**Query format**:
```
[out:json][timeout:{25|60}];
node["amenity"="bicycle_repair_station"](around:{radiusM},{lat},{lon});
out body;
```

| Parameter | Normal fetch | Fallback fetch |
|-----------|-------------|----------------|
| Radius | 65,000 m (65 km / ~40 mi) | 1,609,340 m (1,609 km / 1,000 mi) |
| Timeout | 25 s | 60 s |
| Method | POST | POST |
| Body encoding | `application/x-www-form-urlencoded` | same |

**Response shape** (`OverpassNode`):
```typescript
{
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    opening_hours?: string;
    description?: string;
    "service:bicycle:tools"?: string;   // "yes" | undefined
    "service:bicycle:pump"?: string;    // "yes" | undefined
    "service:bicycle:repair"?: string;  // "yes" | undefined
    operator?: string;
    [key: string]: string | undefined;
  };
}
```

**Error handling**: HTTP 4xx/5xx triggers fallback mirror cascade. `AbortError` is silently swallowed. All other errors surface a dismissible `ErrorToast`.

---

### 5.2 Nominatim — Geocoding

**Purpose**: Convert free-text location search to `{ lat, lng }` coordinates.

**Endpoint**: `https://nominatim.openstreetmap.org/search`

**Request**:
```
GET /search?format=json&limit=1&q={encodeURIComponent(query)}
Headers: Accept-Language: en
```

**Response**: Array of results; only `results[0].lat` and `results[0].lon` are consumed.

**Rate limiting**: No key required. One request fires per user-initiated search; no polling.

---

### 5.3 YouTube Image CDN — Repair Guide Thumbnails

**Purpose**: Display video thumbnails without a YouTube API key.

**URL pattern**: `https://i.ytimg.com/vi/{videoId}/mqdefault.jpg`

**Format**: `mqdefault` = medium quality, 320 × 180 px JPEG. All video IDs have been verified to return HTTP 200.

**Videos**: Park Tool bike repair & maintenance series. See `GuidesPage.tsx` for the complete ID list.

---

### 5.4 Map Tile Providers

All tile requests are made directly from the user's browser. No API keys. No proxying.

| Layer | Base tiles | Overlay | Attribution |
|-------|-----------|---------|-------------|
| **Cycling** (default) | CARTO Positron | WaymarkedTrails Cycling (opacity 0.85) + WaymarkedTrails MTB (opacity 0.6) | OSM contributors + CARTO / Waymarked Trails |
| **Satellite** | ESRI World Imagery | CARTO Voyager labels-only | Esri + source list + OSM + CARTO |
| **Standard** | CARTO Voyager | — | OSM contributors + CARTO |

**Dark mode**: A single CSS filter (`invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)`) is applied to `.leaflet-tile-pane` via the `.map-dark-tiles` class. Satellite is excluded — its natural colours are retained even in dark mode.

**CARTO tile base URL**: `https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png` (subdomains `abcd`)

**ESRI tile URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

**WaymarkedTrails URL**: `https://tile.waymarkedtrails.org/{type}/{z}/{x}/{y}.png`

---

### 5.5 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OVERPASS_ENDPOINT` | `https://overpass-api.de/api/interpreter` | Primary Overpass endpoint URL |

---

### 5.6 localStorage Keys

| Key | Contents | TTL |
|-----|----------|-----|
| `brs_v2` | `StationCache` JSON (center, radiusKm, stations[], fetchedAt) | 24 hours |
| `brs-theme` | `"light" \| "dark" \| "system"` | Permanent (user preference) |
| `brs-unit` | `"mi" \| "km"` | Permanent (user preference) |

---

## 6. Development Plan & Architecture Notes

### 6.1 Completed Work

| Area | Decision / Implementation |
|------|--------------------------|
| **Routing** | `MapPage` rendered outside `<Routes>` — never unmounts. Overlay pages use `fixed inset-0 z-[2000]` to cover the map. |
| **Map centering** | `map.flyTo` on marker click (current zoom, 0.8 s). `autoPan={false}` on Leaflet `<Popup>` prevents double-pan jitter. |
| **Popup dismiss** | `map.closePopup()` added to `dragstart` event in `MapEventHandler`. |
| **Colour audit** | Full WCAG contrast audit completed. All failures corrected: muted text upgraded from slate-500 to slate-400 in dark mode; active buttons use MD3 inversion (light bg + `text-black` in dark mode); Get Directions button uses CSS `!important` to override both UA `a:visited` and Leaflet's `!important` parent colour. |
| **Dark mode tiles** | Single CSS filter recipe applied to `.leaflet-tile-pane` via `.map-dark-tiles` class. Eliminates all separate dark tile providers. Satellite excluded from inversion. |
| **Surface edges** | All shadow-only surfaces in dark mode given explicit `border border-[#1e2a3a]` — shadows are invisible on near-black backgrounds. |
| **Repair guide videos** | All Park Tool video IDs verified via HTTP against `i.ytimg.com`. |
| **Fallback search** | `useFallbackQuery` hook: fires 1,609 km / 60 s Overpass query when primary returns empty. Returns 5 nearest, updates `selectedDist` to farthest distance. Unit-change in fallback mode converts exactly (no preset snap). |
| **CI / CD** | GitHub Actions `Lint & Build` workflow runs on every PR and push to `main`. Deploy handled by Vercel GitHub integration — no CLI tokens or deploy step in CI. |
| **SettingsContext split** | Context split into `SettingsContext.tsx` (provider), `settingsCtx.ts` (context object), and `useSettings.ts` (hook) to satisfy ESLint fast-refresh rules. |

### 6.2 Known Limitations

| Item | Detail |
|------|--------|
| **Ad slot height** | The current ad banner is 50 px — fits a 320 × 50 Mobile Banner but not a 320 × 100 Large Mobile Banner (higher CPM). Increasing to 100 px requires changing `style={{ height: 50 }}` in `AdBanner.tsx` and updating `StationListView` from `bottom-[65px]` to `bottom-[115px]`. |
| **Overpass rate limits** | All three mirrors may be slow during peak hours. No retry back-off beyond the mirror cascade. |
| **Fallback query size** | A 1,609 km radius Overpass query can return thousands of nodes in densely-mapped regions. Currently no cap; the hook takes the 5 nearest from whatever is returned. |
| **Settings page** | Distance unit and colour theme are currently only accessible via the Menu Drawer. The dedicated Settings page is a placeholder. |
| **Tile caching scope** | The Workbox runtime cache targets the OSM tile domain pattern only. CARTO, ESRI, and WaymarkedTrails tiles are not currently cached offline. |

### 6.3 Planned / Future Work

| Priority | Item |
|----------|------|
| High | Implement Settings page (distance unit, default radius, theme — persisted preferences) |
| High | Expand Workbox runtime caching to cover CARTO, ESRI, and WaymarkedTrails tile domains |
| High | Increase ad slot to 100 px for 320 × 100 Large Mobile Banner support |
| Medium | Overpass query retry back-off with exponential delay |
| Medium | Cluster markers at low zoom levels (currently all markers render individually) |
| Medium | Internationalisation (i18n) — English, Spanish, French UI strings |
| Low | Service Worker background sync to refresh station cache while offline |
| Low | "Report station issue" link that pre-fills an OSM changeset |
| Low | Swipe-to-dismiss gesture on the station list panel |

### 6.4 Build & Run

```bash
# Install dependencies
npm install

# Development server (HMR)
npm run dev

# Type-check + production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

**Output**: `dist/` contains the fully static PWA ready for deployment to any static host (Vercel, Netlify, GitHub Pages, etc.).

**Vercel config** (`vercel.json`): SPA rewrite `"/(.*)" → "/index.html"` + `Referrer-Policy: strict-origin-when-cross-origin` security header.

### 6.5 Third-Party Licences & Attribution

| Service | Licence / Terms |
|---------|----------------|
| OpenStreetMap data | [ODbL 1.0](https://www.openstreetmap.org/copyright) — attribution required |
| Leaflet | [BSD 2-Clause](https://leafletjs.com) |
| CARTO tiles (Positron, Voyager) | [CARTO Attributions](https://carto.com/attributions) — free, no key |
| ESRI World Imagery | [Esri Terms](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery) — free, no key |
| WaymarkedTrails Cycling overlay | [CC-BY-SA](https://cycling.waymarkedtrails.org) — free, no key |
| WaymarkedTrails MTB overlay | [CC-BY-SA](https://mtb.waymarkedtrails.org) — free, no key |
| Overpass API | Free, no key required — [overpass-api.de](https://overpass-api.de) |
| Nominatim | Free, [usage policy](https://operations.osmfoundation.org/policies/nominatim/) — max 1 req/s |
| Park Tool videos | © Park Tool Co. — linked only, not embedded or reproduced |
| Vercel Analytics | [Vercel Terms](https://vercel.com/legal/privacy-policy) |

---

*This document should be updated whenever a significant feature is added, a breaking architectural decision is made, or an API integration changes.*
