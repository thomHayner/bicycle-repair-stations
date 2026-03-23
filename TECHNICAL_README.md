# BicycleRepairStations.com — Technical README

> Combined project reference document covering charter, features, user stories, technical specification, data & API specification, and development notes.
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
| F-01 | **Auto-locate** | On load, requests GPS via `watchPosition`. Centers map and fetches stations automatically. Falls back to London (51.505, -0.09) if permission is denied. |
| F-02 | **Location search** | Geocodes free-text input via Nominatim and re-centers the map. Shows inline error if location not found. |
| F-03 | **Search this area** | Floating button appears when the map center drifts > 18 miles from the last fetch anchor; triggers a fresh Overpass query at the current map center. |
| F-04 | **Overpass station fetch** | Queries `amenity=bicycle_repair_station` nodes within a 65 km radius. Results cached in `localStorage` for 24 hours; re-fetched only when the user moves > ~24.7 km from the last fetch center. |
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
| F-14 | **Fallback loading state** | While the wide-area search is running, the list shows "Searching wider area…" with a spinner. |

### 2.3 Map Controls
| # | Feature | Notes |
|---|---------|-------|
| F-15 | **Map layers** | Four tile layer options: Default (CARTO Voyager / Dark Matter), Satellite (Esri World Imagery), Terrain (Stadia Stamen / Alidade Smooth Dark), Cycling (CARTO + Waymarked Trails overlay). Light/dark variants switch automatically with theme. |
| F-16 | **Zoom controls** | Custom +/− FABs (native Leaflet zoom controls hidden). Position adjusts when the station list expands. |
| F-17 | **Locate me FAB** | Re-centers map on the user's current GPS position at zoom 18. Disabled (visually dimmed) until GPS resolves. |
| F-18 | **Zoom-out guard** | If the visible map width exceeds 75 miles, station markers are hidden and a "Zoom in to see repair stations" toast is shown. |
| F-19 | **User position marker** | Blue pulsing dot with accuracy radius ring. |

### 2.4 Navigation & Pages
| # | Feature | Notes |
|---|---------|-------|
| F-20 | **Always-mounted map** | `MapPage` renders unconditionally outside `<Routes>`. Navigating to overlay pages (Guides, Settings, About) never unmounts or reloads the map. |
| F-21 | **Repair Guides** | Curated Park Tool YouTube video library organised into 7 categories (Flat Tyre, Brakes, Gears, Chain, Wheels, Headset, Bottom Bracket). Thumbnails loaded from YouTube's image CDN; tapping opens YouTube. |
| F-22 | **Settings** | Placeholder page — distance unit and colour theme preferences planned (unit/theme currently accessible via the Menu Drawer). |
| F-23 | **About** | Credits (OpenStreetMap, Leaflet, CARTO, Overpass API), Contribute link (add a missing station on OSM), Privacy Policy, and Terms of Service — all inline with accordion expand/collapse. |
| F-24 | **Menu drawer** | Left-side slide-in drawer for page navigation, theme toggle (Light / Dark / System), and unit toggle (mi / km). |

### 2.5 PWA & Accessibility
| # | Feature | Notes |
|---|---------|-------|
| F-26 | **PWA install** | `manifest.json` with `display: standalone`, 192 × 192 and 512 × 512 icons. Workbox `generateSW` precaches all JS/CSS/HTML assets. OSM tiles cached separately (CacheFirst, 7-day TTL, 500 entry cap). |
| F-27 | **Dark mode** | Class-based (`dark` on `<html>`). Follows system preference by default; overridable to Light or Dark. All colour tokens defined in CSS custom properties. |
| F-28 | **WCAG contrast** | All text/background combinations meet WCAG AA (4.5 : 1 normal text, 3 : 1 large / UI). Primary interactive elements (buttons, badges) meet AAA (7 : 1). |
| F-29 | **Touch targets** | All buttons and links ≥ 44 × 44 px. |
| F-30 | **Ad banner slot** | Fixed 50 px bottom bar reserved for a 320 × 50 Mobile Banner ad unit (Google AdSense compatible). Supports standard `adsbygoogle` markup. Note: a 320 × 100 Large Mobile Banner would require increasing the slot to 100 px and adjusting the station list offset from `bottom-[65px]` to `bottom-[115px]`. |

---

## 3. User Stories

Stories are drawn from actual feature requests and design decisions made during development.

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

*Acceptance criteria:* When the primary query returns 0 results, the list automatically shows "Searching wider area…", then either lists the 5 nearest stations within 1,000 miles (with the radius display updated to the farthest station's distance) or shows "No stations within 1,000 mi".

---

**US-04 — Get directions to a station**
> As a cyclist, I want tapping "Get Directions" to open my phone's native maps app in cycling mode, so I get turn-by-turn navigation without switching apps manually.

*Acceptance criteria:* On iOS, the link opens Apple Maps with `dirflg=b` (cycling). On Android/desktop, it opens Google Maps with `travelmode=bicycling`. Both open the installed native app if available.

---

### 3.2 Map Interaction

**US-05 — Tap a marker to see station details**
> As a map user, I want tapping a station marker to center the map on that station and show me its details without zooming in or out, so I keep my current context.

*Acceptance criteria:* Tapping a marker calls `map.flyTo` at the current zoom level (no zoom change) with a smooth 0.8 s animation. A Leaflet popup opens showing the station's name, amenities, and directions button. `autoPan` is disabled to prevent double-pan jitter.

---

**US-06 — Dismiss a popup by dragging**
> As a map user, I want the popup to close when I start dragging the map so it doesn't obscure my view while panning.

*Acceptance criteria:* The Leaflet `dragstart` event calls `map.closePopup()` before the existing `onMapInteraction()` handler.

---

**US-07 — Navigate to a page and return without the map reloading**
> As a user, I want to browse Repair Guides and come back to the map without seeing the map reinitialise, so my current position and open station are preserved.

*Acceptance criteria:* `MapPage` is rendered outside `<Routes>` and is never unmounted. Overlay pages (`/guides`, `/settings`, `/about`) are `fixed inset-0 z-[2000]` panels that cover the map without unmounting it.

---

**US-08 — Switch map style**
> As a user, I want to switch between a standard street map, satellite imagery, terrain view, and a cycling-routes overlay so I can choose the best context for my ride.

*Acceptance criteria:* The layer FAB opens a picker with four options. The selected layer persists for the session. Dark and light tile variants switch automatically with the app theme.

---

### 3.3 Filtering & Distance

**US-09 — Filter by amenity type**
> As a cyclist with a specific need (e.g. I only need a pump), I want to filter the station list to show only stations with the equipment I need.

*Acceptance criteria:* Three toggle buttons — Pump, Tools, Repair — apply AND logic to the station list. Selecting multiple filters shows only stations matching all selected criteria. A "Clear" button resets all filters.

---

**US-10 — Adjust the search radius**
> As a user in a dense city, I want to narrow the displayed results to the closest 1–2 miles. As a user in a sparse area, I want to widen it to 25 miles.

*Acceptance criteria:* Distance pills (1, 2, 5, 10, 15, 20, 25 mi or equivalent km) filter the displayed list and markers. The radius auto-increases as the user zooms out but never auto-decreases. Manual selection always wins.

---

**US-11 — Use kilometres instead of miles**
> As a non-US cyclist, I want all distances shown in kilometres.

*Acceptance criteria:* The unit toggle (mi / km) is accessible from the Menu Drawer and the station list panel. Switching units converts the current distance selection to the nearest equivalent preset. The preference persists across sessions via `localStorage`.

---

### 3.4 Appearance & Accessibility

**US-12 — Use the app in dark mode**
> As a night rider, I want a dark theme that doesn't blind me when checking the map in low light.

*Acceptance criteria:* Dark mode is available as an explicit option and also follows the OS preference when set to "System". All UI surfaces, borders, text, and buttons have verified WCAG-compliant contrast in both themes.

---

**US-13 — Use the app as a home-screen icon**
> As a frequent user, I want to install the app to my home screen so it opens full-screen like a native app.

*Acceptance criteria:* The site is a valid PWA with a `manifest.json`, service worker, and appropriate icons (192 px, 512 px). `display: standalone` removes the browser chrome when launched from the home screen.

---

### 3.5 Content

**US-14 — Watch bike repair tutorials**
> As a cyclist who wants to fix their own bike, I want access to guided repair videos I can follow step-by-step.

*Acceptance criteria:* The Repair Guides page shows Park Tool YouTube videos organised into 7 categories. Each card shows a thumbnail (loaded from `i.ytimg.com`), title, and external link icon. Tapping opens the video on YouTube.

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
| Linting | ESLint + typescript-eslint | 9.x / 8.x |

### 4.2 Project Structure

```
src/
├── components/
│   ├── AdBanner/          # Bottom ad slot
│   ├── Map/               # MapView, StationMarker, UserMarker, StationPopup
│   ├── Menu/              # MenuDrawer (nav + theme/unit settings)
│   ├── Toolbar/           # Toolbar (search, locate FAB, layer FAB), RadiusFilter
│   ├── ErrorBoundary.tsx
│   ├── ErrorToast.tsx
│   ├── LoadingOverlay.tsx
│   └── StationListView.tsx
├── context/
│   └── SettingsContext.tsx  # Theme + unit, persisted to localStorage
├── hooks/
│   ├── useGeolocation.ts    # GPS watchPosition with fallback
│   ├── useOverpassQuery.ts  # Primary station fetch + cache logic
│   └── useFallbackQuery.ts  # Wide-area fallback (up to 1,000 mi)
├── lib/
│   ├── directions.ts        # Platform-aware directions URL builder
│   ├── distance.ts          # Haversine formula + visible-width helper
│   ├── env.ts               # VITE_ environment variable defaults
│   ├── layers.ts            # Map tile layer definitions
│   ├── overpass.ts          # Overpass query builder + fetch with mirror fallback
│   ├── stationCache.ts      # localStorage cache read/write/coverage check
│   └── units.ts             # Unit types and preset distance options
├── pages/
│   ├── AboutPage.tsx
│   ├── DiagnosePage.tsx
│   ├── GuidesPage.tsx
│   ├── MapPage.tsx          # Root page — always mounted
│   └── SettingsPage.tsx
├── types/
│   └── overpass.ts          # OverpassNode + OverpassResponse interfaces
├── App.tsx                  # Route layout — MapPage outside Routes
├── main.tsx
└── index.css                # Tailwind + Leaflet + CSS custom properties
```

### 4.3 Routing Architecture

`MapPage` is rendered **outside** `<Routes>` so it is never unmounted during navigation. Overlay pages are rendered inside `<Routes>` as `fixed inset-0 z-[2000]` full-screen panels. When a route is active its panel covers the map; when inactive it simply does not render — the map beneath it is always live.

```tsx
// App.tsx
<SettingsProvider>
  <MapPage />                     {/* Always mounted */}
  <Suspense fallback={null}>
    <Routes>
      <Route path="/guides"   element={<GuidesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about"    element={<AboutPage />} />
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
| Map tiles (OSM) | Workbox `osm-tiles` | 7 days | Max 500 entries (LRU) |
| App shell (JS/CSS/HTML) | Workbox precache | Service worker update | New SW install |

Cache coverage check: a new Overpass fetch is only triggered when the user's position is more than **~24.7 km** from the last fetch centre (= 65 km fetch radius − 40.3 km max display radius).

### 4.7 Theme System

Tailwind v4 class-based dark mode (`@variant dark (&:where(.dark, .dark *))`). The `dark` class is toggled on `<html>` by `SettingsContext`. All colours are defined as CSS custom properties in `:root` and `.dark` blocks in `index.css`, ensuring consistent theming across Leaflet popups (which live outside the React tree) and Tailwind utility classes.

### 4.8 Directions Logic

```typescript
// iOS → Apple Maps cycling mode
`https://maps.apple.com/?daddr=${lat},${lon}&dirflg=b`

// Android / Desktop → Google Maps cycling mode
`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=bicycling`
```

Detection: `navigator.userAgent` check for `iPad|iPhone|iPod`.

### 4.9 Accessibility Standards

- **Contrast**: All text/surface combinations verified against WCAG 2.1. Light-mode dark text on white backgrounds; dark-mode uses slate-400 (`#94a3b8`, 7.6 : 1) as the minimum for secondary text. Active buttons use inverted MD3 pattern in dark mode (light tonal background + `text-black`, ≥ 12 : 1).
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
**Fallback mirrors** (tried in order on HTTP 429/502/503/504):
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

**Error handling**: HTTP 4xx/5xx triggers fallback mirror cascade. `AbortError` (user navigated away) is silently swallowed. All other errors surface a dismissible `ErrorToast`.

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

**Format**: `mqdefault` = medium quality, 320 × 180 px JPEG. All 19 video IDs have been verified to return HTTP 200.

**Videos**: Park Tool bike repair & maintenance series. See `GuidesPage.tsx` for the complete ID list.

---

### 5.4 Map Tile Providers

| Layer | Light tiles | Dark tiles | Attribution required |
|-------|-------------|------------|----------------------|
| Default | CARTO Voyager | Stadia Alidade Smooth Dark | OSM contributors + CARTO / Stadia |
| Satellite | Esri World Imagery | _(same)_ | Esri + source list |
| Terrain | Stadia Stamen Terrain | Stadia Alidade Smooth Dark | Stadia + Stamen + OSM |
| Cycling | CyclOSM | CARTO Dark Matter + Waymarked Trails overlay | CyclOSM + OSM / OSM + CARTO + Waymarked Trails |

All tile requests are made directly from the user's browser. No proxying.

---

### 5.5 Environment Variables

Configured in `.env` / `.env.local` at project root. All are optional; defaults are shown.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OVERPASS_ENDPOINT` | `https://overpass-api.de/api/interpreter` | Primary Overpass endpoint URL |
| `VITE_DEFAULT_RADIUS_KM` | `2` | Initial fetch radius (currently unused; FETCH_RADIUS_KM = 65 is hardcoded) |
| `VITE_FALLBACK_LAT` | `51.505` | Map center latitude when geolocation is unavailable |
| `VITE_FALLBACK_LNG` | `-0.09` | Map center longitude when geolocation is unavailable |

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
| **Surface edges** | All shadow-only surfaces in dark mode given explicit `border border-[#1e2a3a]` — shadows are invisible on near-black backgrounds. |
| **Video IDs** | All 19 Park Tool video IDs were verified via HTTP against `i.ytimg.com`. Original IDs were placeholder values; replacements are confirmed Park Tool videos. |
| **Fallback search** | `useFallbackQuery` hook: fires 1,609 km / 60 s Overpass query when primary returns empty. Returns 5 nearest, updates `selectedDist` to farthest distance. Unit-change in fallback mode converts exactly (no preset snap). |

### 6.2 Known Limitations

| Item | Detail |
|------|--------|
| **Ad slot height** | The current ad banner is 50 px — fits a 320 × 50 Mobile Banner but not a 320 × 100 Large Mobile Banner (higher CPM). Increasing to 100 px requires changing `style={{ height: 50 }}` in `AdBanner.tsx` and updating `StationListView` from `bottom-[65px]` to `bottom-[115px]`. |
| **Overpass rate limits** | All three mirrors may be slow during peak hours. No retry back-off beyond the mirror cascade. |
| **Fallback query size** | A 1,609 km radius Overpass query can return thousands of nodes in densely-mapped regions. Currently no cap; the hook takes the 5 nearest from whatever is returned. |
| **Settings page** | Distance unit and colour theme are currently only accessible via the Menu Drawer. The dedicated Settings page is a placeholder. |

### 6.3 Planned / Future Work

| Priority | Item |
|----------|------|
| High | Implement Settings page (distance unit, default radius, theme — persisted preferences) |
| High | Increase ad slot to 100 px for 320 × 100 Large Mobile Banner support |
| Medium | Overpass query retry back-off with exponential delay |
| Medium | Cluster markers at low zoom levels (currently all markers render individually) |
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

**Vercel config** (`vercel.json`): single rewrite rule `"/(.*)" → "/index.html"` for client-side routing.

### 6.5 Third-Party Licences & Attribution

| Service | Licence / Terms |
|---------|----------------|
| OpenStreetMap data | [ODbL 1.0](https://www.openstreetmap.org/copyright) — attribution required |
| Leaflet | [BSD 2-Clause](https://leafletjs.com) |
| CARTO tiles | [CARTO Attributions](https://carto.com/attributions) |
| Esri World Imagery | [Esri Terms](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery) |
| Stadia Maps tiles | [Stadia Maps Terms](https://stadiamaps.com) |
| Waymarked Trails overlay | [CC-BY-SA](https://cycling.waymarkedtrails.org) |
| Overpass API | Free, no key required — [overpass-api.de](https://overpass-api.de) |
| Nominatim | Free, [usage policy](https://operations.osmfoundation.org/policies/nominatim/) — max 1 req/s, must set User-Agent |
| Park Tool videos | © Park Tool Co. — linked only, not embedded or reproduced |

---

*This document should be updated whenever a significant feature is added, a breaking architectural decision is made, or an API integration changes.*
