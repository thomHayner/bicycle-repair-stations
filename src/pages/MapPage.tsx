import { useEffect, useRef, useState, lazy, Suspense } from "react";
import type { Map as LeafletMap, LatLng } from "leaflet";
import { useGeolocation } from "../hooks/useGeolocation";
import { useOverpassQuery } from "../hooks/useOverpassQuery";
import { useFallbackQuery, FALLBACK_RADIUS_MI } from "../hooks/useFallbackQuery";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ErrorToast } from "../components/ErrorToast";
import { AdBanner } from "../components/AdBanner/AdBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { StationListView } from "../components/StationListView";
import { haversineDistanceMiles } from "../lib/distance";
import { type Unit, KM_PER_MILE, MI_OPTIONS, KM_OPTIONS } from "../lib/units";
import { type LayerId } from "../lib/layers";
import { useSettings } from "../context/SettingsContext";
import type { OverpassNode } from "../types/overpass";

const MapView = lazy(() =>
  import("../components/Map/MapView").then((m) => ({ default: m.MapView }))
);

export default function MapPage() {
  const geo = useGeolocation();
  const mapRef = useRef<LeafletMap | null>(null);

  // Location the user explicitly provided (geo or search) — drives Overpass fetches
  const [givenLocation, setGivenLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Last known map centre — fallback filter anchor when no givenLocation
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Distance filter — unit comes from global settings; selectedDist is local session state
  const { unit, setUnit } = useSettings();
  const [selectedDist, setSelectedDist] = useState(1);
  const displayMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;

  const [activeLayer, setActiveLayer] = useState<LayerId>("cycling");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [listExpanded, setListExpanded] = useState(false);

  const userPosition =
    geo.status === "resolved" || geo.status === "denied"
      ? {
          lat: geo.lat,
          lng: geo.lng,
          accuracy: geo.status === "resolved" ? geo.accuracy : undefined,
        }
      : null;

  const locationDenied = geo.status === "denied";

  // Set givenLocation once geolocation resolves (only once — not on every watchPosition tick)
  useEffect(() => {
    if (geo.status === "resolved" && !givenLocation) {
      const { lat, lng } = geo;
      setGivenLocation({ lat, lng });
    }
  }, [geo, givenLocation]);

  // Overpass only fires when givenLocation changes — never on map pan
  const overpass = useOverpassQuery(
    givenLocation?.lat ?? null,
    givenLocation?.lng ?? null
  );

  const allStations = overpass.status === "success" ? overpass.stations : [];

  // Fallback: when the primary query returns nothing, search up to 1 000 miles
  const fallbackEnabled = overpass.status === "success" && allStations.length === 0;
  const fallback = useFallbackQuery(
    givenLocation?.lat ?? null,
    givenLocation?.lng ?? null,
    fallbackEnabled,
  );

  // When fallback succeeds, set selectedDist to the farthest station's distance.
  // Keep a ref so handleUnitChange can convert it without snapping to a preset.
  const fallbackFarthestMiRef = useRef<number | null>(null);
  useEffect(() => {
    if (fallback.status === "success") {
      fallbackFarthestMiRef.current = fallback.farthestMi;
      const distInUnit = unit === "mi"
        ? fallback.farthestMi
        : fallback.farthestMi * KM_PER_MILE;
      setSelectedDist(Math.round(distInUnit * 10) / 10);
    } else if (fallback.status === "none" || fallback.status === "idle") {
      fallbackFarthestMiRef.current = null;
    }
  }, [fallback]); // eslint-disable-line react-hooks/exhaustive-deps

  // Map pan updates the filter anchor (used only when no givenLocation)
  const handleMoveEnd = (center: LatLng) => {
    setMapCenter({ lat: center.lat, lng: center.lng });
    setErrorDismissed(false);
  };

  const handleLocationFound = (pos: { lat: number; lng: number }, zoom = 13) => {
    setGivenLocation(pos);
    setErrorDismissed(false);
    if (mapRef.current) {
      mapRef.current.flyTo([pos.lat, pos.lng], zoom, { duration: 1.2 });
    }
  };

  const handleStationSelect = (station: OverpassNode) => {
    setSelectedStationId(station.id);
    setListExpanded(false);
    if (mapRef.current) {
      mapRef.current.flyTo([station.lat, station.lon], 16, { duration: 0.8 });
    }
  };

  // Distance pill selected manually by the user
  const handleDistChange = (dist: number) => {
    setSelectedDist(dist);
  };

  // Unit toggle — in normal mode snap to nearest preset; in fallback mode keep exact distance
  const handleUnitChange = (newUnit: Unit) => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    if (fallbackFarthestMiRef.current !== null) {
      // Fallback mode: convert the farthest station distance exactly (no preset snapping)
      const dist = newUnit === "km"
        ? fallbackFarthestMiRef.current * KM_PER_MILE
        : fallbackFarthestMiRef.current;
      setSelectedDist(Math.round(dist * 10) / 10);
    } else {
      const currentMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;
      const converted = newUnit === "km" ? currentMiles * KM_PER_MILE : currentMiles;
      const options = newUnit === "km" ? KM_OPTIONS : MI_OPTIONS;
      const closest = [...options].reduce((a, b) =>
        Math.abs(b - converted) < Math.abs(a - converted) ? b : a
      );
      setSelectedDist(closest);
    }
  };

  // Auto-increase the displayed distance as the user zooms out.
  // Picks the largest option that fits within the visible radius.
  // Never auto-decreases — only a manual pill selection can reduce it.
  const handleVisibleWidthChange = (widthMiles: number) => {
    const visibleRadius = widthMiles / 2;
    const options = unit === "mi" ? MI_OPTIONS : KM_OPTIONS;
    const radiusInUnit = unit === "km" ? visibleRadius * KM_PER_MILE : visibleRadius;
    const suitable = [...options].filter((d) => d <= radiusInUnit);
    if (suitable.length === 0) return;
    const suggested = suitable[suitable.length - 1]; // largest that still fits
    setSelectedDist((prev) => (suggested > prev ? suggested : prev));
  };

  const isInitialLoading = geo.status === "idle" || geo.status === "loading";

  const showSearchHere =
    givenLocation !== null &&
    mapCenter !== null &&
    haversineDistanceMiles(mapCenter.lat, mapCenter.lng, givenLocation.lat, givenLocation.lng) > 18;

  const handleSearchHere = () => {
    if (mapCenter) setGivenLocation(mapCenter);
  };

  // Filter centre: explicit location (geo/search) → map centre → null
  const filterCenter = givenLocation ?? mapCenter;

  // Normal filtered view
  const filteredStations = filterCenter
    ? allStations.filter(
        (s) =>
          haversineDistanceMiles(s.lat, s.lon, filterCenter.lat, filterCenter.lng) <=
          displayMiles
      )
    : allStations;

  // In fallback mode, swap in the 5 nearest stations (pre-filtered by the hook)
  const displayStations =
    fallbackEnabled && fallback.status === "success"
      ? fallback.stations
      : filteredStations;

  const fallbackListStatus =
    fallbackEnabled && fallback.status === "loading" ? "loading"
    : fallbackEnabled && fallback.status === "none"    ? "none"
    : undefined;

  const showError = overpass.status === "error" && !errorDismissed;

  return (
    <>
      <LoadingOverlay visible={isInitialLoading} />

      {showSearchHere && (
        <div
          className="fixed left-0 right-0 z-[999] flex justify-center pointer-events-none transition-[top] duration-200"
          style={{ top: locationDenied ? 112 : 80 }}
        >
          <button
            onClick={handleSearchHere}
            className="pointer-events-auto flex items-center gap-2 bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-[#1e2a3a] rounded-full px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search this area
          </button>
        </div>
      )}

      <Toolbar
        onLocationFound={handleLocationFound}
        mapRef={mapRef}
        userPosition={userPosition}
        locationDenied={locationDenied}
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        unit={unit}
        onUnitChange={handleUnitChange}
      />

      <ErrorBoundary>
        <Suspense fallback={null}>
          <MapView
            userPosition={userPosition}
            stations={displayStations}
            onMoveEnd={handleMoveEnd}
            mapRef={mapRef}
            isQuerying={overpass.status === "loading" || fallback.status === "loading"}
            selectedStationId={selectedStationId}
            onStationDeselect={() => setSelectedStationId(null)}
            onMapInteraction={() => setListExpanded(false)}
            onVisibleWidthChange={handleVisibleWidthChange}
            activeLayer={activeLayer}
            listExpanded={listExpanded}
          />
        </Suspense>
      </ErrorBoundary>

      <StationListView
        stations={displayStations}
        filterCenter={filterCenter}
        unit={unit}
        onUnitChange={handleUnitChange}
        selectedDist={selectedDist}
        onDistChange={handleDistChange}
        onStationSelect={handleStationSelect}
        expanded={listExpanded}
        onExpandedChange={setListExpanded}
        fallbackStatus={fallbackListStatus}
        fallbackRadiusMi={FALLBACK_RADIUS_MI}
        isQuerying={overpass.status === "loading" || fallback.status === "loading"}
      />

      <AdBanner />

      {showError && overpass.status === "error" && (
        <ErrorToast
          message={overpass.message}
          onDismiss={() => setErrorDismissed(true)}
        />
      )}
    </>
  );
}
