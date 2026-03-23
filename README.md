# BicycleRepairStations.com

A mobile-first Progressive Web App to find bicycle repair stations near you, powered by [OpenStreetMap](https://www.openstreetmap.org/) data.

## Features

- **Geolocation on load** — instantly centers the map on your position
- **Nearby stations** — queries the Overpass API for `amenity=bicycle_repair_station` nodes
- **Station popups** — shows name, opening hours, and available tools/pump/repair info
- **Radius filter** — toggle between 500m / 1km / 2km / 5km search radius
- **Re-center button** — fly back to your position with one tap
- **Offline tile caching** — previously visited map tiles work without signal (service worker)
- **PWA installable** — add to home screen on Android and iOS

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Vite + React + TypeScript |
| Map | Leaflet.js + react-leaflet |
| Tiles | OpenStreetMap (no API key needed) |
| Station data | Overpass API |
| Styling | Tailwind CSS v4 |
| PWA/SW | vite-plugin-pwa + Workbox |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/your-username/bicycle-repair-stations.git
cd bicycle-repair-stations
npm install
```

### Environment setup

```bash
cp .env.example .env.local
# Edit .env.local if you want to change defaults
```

### Run dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Allow location access when prompted.

### Build for production

```bash
npm run build
npm run preview  # serve the dist/ folder locally
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OVERPASS_ENDPOINT` | `https://overpass-api.de/api/interpreter` | Overpass API URL. Use a mirror if rate-limited. |
| `VITE_DEFAULT_RADIUS_KM` | `2` | Initial search radius in km |
| `VITE_FALLBACK_LAT` | `51.505` | Latitude shown when geolocation is denied |
| `VITE_FALLBACK_LNG` | `-0.09` | Longitude shown when geolocation is denied |

## Project Structure

```
src/
├── types/overpass.ts        # Typed Overpass API response shapes
├── lib/
│   ├── env.ts               # Typed environment variable accessors
│   ├── overpass.ts          # Overpass query builder + fetcher
│   └── leafletConfig.ts     # Leaflet icon fix + custom DivIcons
├── hooks/
│   ├── useGeolocation.ts    # One-shot geolocation with fallback
│   └── useOverpassQuery.ts  # Debounced, cached, abortable Overpass fetcher
└── components/
    ├── Map/                 # MapView, UserMarker, StationMarker, StationPopup
    ├── Toolbar/             # Top bar with logo, radius filter, re-center
    ├── AdBanner/            # Bottom ad slot placeholder
    ├── LoadingOverlay.tsx   # Initial loading screen
    └── ErrorToast.tsx       # Auto-dismissing error notification
```

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Vercel auto-detects **Vite** — no framework config needed
4. Under **Environment Variables**, add your `VITE_*` vars (optional — defaults work fine)
5. Click **Deploy**

The `vercel.json` in this repo handles SPA routing (all paths → `index.html`).

## Architecture Notes

### Leaflet + React

Leaflet is an imperative DOM library — `react-leaflet` wraps it in React context. Key rules followed:
- `MapContainer` is never unmounted (avoids expensive re-init)
- Map events are handled via a child `MapEventHandler` component using `useMapEvents`
- The map `ref` is held at the `App` level so the Toolbar's re-center button can call `map.flyTo()`
- `MapView` is lazy-loaded (`React.lazy`) to keep the initial bundle lean

### Overpass API

- Queries use `POST` with `application/x-www-form-urlencoded` (correct per Overpass docs)
- Radius is specified as `(around:METERS,LAT,LON)` for a true circle, not a bounding box
- Results are cached in memory (module-level `Map`) — cache key: `lat,lng,radiusKm`
- Map moves are debounced 600ms; radius changes query immediately
- In-flight requests are cancelled with `AbortController` when superseded

### PWA / Offline

- OSM tiles are cached via Workbox `CacheFirst` (7-day TTL, max 500 tiles)
- App shell (JS/CSS/HTML) is precached on install
- Service worker auto-updates on new deploy

## Data Source

Station data comes from OpenStreetMap contributors. If a station near you is missing, you can add it at [openstreetmap.org](https://www.openstreetmap.org/) using the tag `amenity=bicycle_repair_station`.

## License

MIT
