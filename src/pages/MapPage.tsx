import { useEffect, useRef, useState, lazy, Suspense } from "react";
import type { Map as LeafletMap, LatLng } from "leaflet";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStationQuery, FALLBACK_RADIUS_MI } from "../hooks/useStationQuery";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ErrorToast } from "../components/ErrorToast";
import { AdBanner } from "../components/AdBanner/AdBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { StationListView } from "../components/StationListView";
import { haversineDistanceMiles } from "../lib/distance";
import { type Unit, KM_PER_MILE, MI_OPTIONS, KM_OPTIONS } from "../lib/units";
import { type LayerId } from "../lib/layers";
import { useSettings } from "../context/useSettings";
import type { OverpassNode } from "../types/overpass";

const MapView = lazy(() =>
  import("../components/Map/MapView").then((m) => ({ default: m.MapView }))
);

export default function MapPage() {
  const geo = useGeolocation();
  const mapRef = useRef<LeafletMap | null>(null);

  // Location the user explicitly provided (geo or search) — drives Overpass fetches
  const [givenLocation, setGivenLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Set only on explicit user actions (typed search / "Search this area") — drives the search pin marker
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
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
    geo.status === "resolved"
      ? { lat: geo.lat, lng: geo.lng, accuracy: geo.accuracy }
      : null;

  const locationDenied = geo.status === "denied";

  // Set givenLocation once geolocation resolves or is denied (only once — not on every watchPosition tick)
  useEffect(() => {
    if ((geo.status === "resolved" || geo.status === "denied") && !givenLocation) {
      const { lat, lng } = geo;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: latch location once on first geo resolve/deny
      setGivenLocation({ lat, lng });
      if (geo.status === "denied") {
        // No GPS — show the search pin at the fallback so user sees where we're searching
        // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern
        setSearchedLocation({ lat, lng });
      }
      // When resolved: searchedLocation stays null — the blue dot already marks the spot
    }
  }, [geo, givenLocation]);

  // Fires when givenLocation changes — never on map pan
  const query = useStationQuery(
    givenLocation?.lat ?? null,
    givenLocation?.lng ?? null,
  );

  const allStations = query.status === "success" ? query.stations : [];

  // When wide-area result arrives, set selectedDist to the farthest station's distance.
  // Keep a ref so handleUnitChange can convert it without snapping to a preset.
  const fallbackFarthestMiRef = useRef<number | null>(null);
  useEffect(() => {
    if (query.status === "success-wide") {
      fallbackFarthestMiRef.current = query.farthestMi;
      const distInUnit = unit === "mi"
        ? query.farthestMi
        : query.farthestMi * KM_PER_MILE;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: sync dist filter when wide result resolves
      setSelectedDist(Math.round(distInUnit * 10) / 10);
    } else if (query.status === "none" || query.status === "idle") {
      fallbackFarthestMiRef.current = null;
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-radius: on each new givenLocation, find the smallest radius with ≥ 5 stations
  // and zoom the map to fit that radius. Runs once per givenLocation value.
  const autoRadiusLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (query.status !== "success" || !givenLocation || allStations.length === 0) return;

    const prev = autoRadiusLocationRef.current;
    if (prev && prev.lat === givenLocation.lat && prev.lng === givenLocation.lng) return;
    autoRadiusLocationRef.current = givenLocation;

    const options = unit === "mi" ? MI_OPTIONS : KM_OPTIONS;
    const found = options.find((dist) => {
      const distMiles = unit === "km" ? dist / KM_PER_MILE : dist;
      return (
        allStations.filter(
          (s) => haversineDistanceMiles(s.lat, s.lon, givenLocation.lat, givenLocation.lng) <= distMiles
        ).length >= 5
      );
    });
    const newDist = found ?? options[options.length - 1];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: auto-select radius once per location
    setSelectedDist(newDist);

    // Zoom map to show the chosen radius as a bounding box
    const distMiles = unit === "km" ? newDist / KM_PER_MILE : newDist;
    const DEG_PER_MILE = 1 / 69;
    const latDelta = distMiles * DEG_PER_MILE;
    const lngDelta = latDelta / Math.cos((givenLocation.lat * Math.PI) / 180);
    mapRef.current?.fitBounds(
      [
        [givenLocation.lat - latDelta, givenLocation.lng - lngDelta],
        [givenLocation.lat + latDelta, givenLocation.lng + lngDelta],
      ],
      { padding: [40, 40], maxZoom: 16 }
    );
  }, [query.status, allStations, givenLocation, unit, mapRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Map pan updates the filter anchor (used only when no givenLocation)
  const handleMoveEnd = (center: LatLng) => {
    setMapCenter({ lat: center.lat, lng: center.lng });
    setErrorDismissed(false);
  };

  const handleLocationFound = (pos: { lat: number; lng: number }, zoom = 13) => {
    setGivenLocation(pos);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(pos.lat, pos.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : pos);
    setErrorDismissed(false);
    if (mapRef.current) {
      mapRef.current.flyTo([pos.lat, pos.lng], zoom, { duration: 1.2 });
    }
  };

  // Recenter to GPS position — clears the search pin since the blue dot already marks the spot
  const handleRecenter = () => {
    if (!userPosition) return;
    setGivenLocation(userPosition);
    setSearchedLocation(null);
    setErrorDismissed(false);
    if (mapRef.current) {
      mapRef.current.flyTo([userPosition.lat, userPosition.lng], 16, { duration: 1.2 });
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

  const isFetchingStations = query.status === "loading" || query.status === "escalating";

  const showOverlay = geo.status === "idle" || geo.status === "loading";

  const showSearchHere =
    givenLocation !== null &&
    mapCenter !== null &&
    haversineDistanceMiles(mapCenter.lat, mapCenter.lng, givenLocation.lat, givenLocation.lng) > 18;

  const handleSearchHere = () => {
    if (!mapCenter) return;
    setGivenLocation(mapCenter);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(mapCenter.lat, mapCenter.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : mapCenter);
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

  // In wide-area mode, swap in the 5 nearest stations (pre-filtered by the hook)
  const displayStations =
    query.status === "success-wide" ? query.stations : filteredStations;

  // GPS distance from user to each displayed station — computed once, shared by list and popups
  const userDistances = userPosition
    ? new Map(displayStations.map((s) => [s.id, haversineDistanceMiles(userPosition.lat, userPosition.lng, s.lat, s.lon)]))
    : null;

  const fallbackListStatus =
    query.status === "escalating" ? "loading"
    : query.status === "none"     ? "none"
    : undefined;

  const showError = query.status === "error" && !errorDismissed;

  return (
    <>
      <LoadingOverlay visible={showOverlay} />

      {(isFetchingStations || showSearchHere) && (
        <div
          className="fixed left-0 right-0 z-[999] flex justify-center pointer-events-none transition-[top] duration-200"
          style={{ top: locationDenied ? 112 : 80 }}
        >
          {/* Grid container = pill shell; both variants overlap at col/row 1 so pill never resizes */}
          <div className="grid bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-[#1e2a3a] rounded-full text-sm font-semibold text-slate-800 dark:text-slate-100">

            {/* Loading variant: [spinner] [text] [invisible 15px spacer] */}
            <div
              className={`col-start-1 row-start-1 flex items-center gap-2 px-4 py-2 pointer-events-none transition-opacity duration-150 ${showSearchHere ? "opacity-0" : "opacity-100"}`}
              aria-hidden={showSearchHere}
            >
              <span className="inline-block w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin shrink-0" />
              Loading stations…
              <span className="w-[15px] h-[15px] shrink-0 invisible" aria-hidden="true" />
            </div>

            {/* Search variant: [spinner-reserved] [text] [search icon] */}
            <button
              onClick={handleSearchHere}
              tabIndex={showSearchHere ? 0 : -1}
              aria-hidden={!showSearchHere}
              className={`col-start-1 row-start-1 flex items-center gap-2 px-4 py-2 rounded-full active:bg-slate-50 dark:active:bg-slate-800/50 transition-opacity duration-150 ${showSearchHere ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            >
              <span className={`inline-block w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full shrink-0 ${isFetchingStations ? "animate-spin" : "invisible"}`} />
              Search this area
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

          </div>
        </div>
      )}

      <Toolbar
        onLocationFound={handleLocationFound}
        onRecenter={handleRecenter}
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
            userDistances={userDistances}
            stations={displayStations}
            onMoveEnd={handleMoveEnd}
            mapRef={mapRef}
            selectedStationId={selectedStationId}
            onStationDeselect={() => setSelectedStationId(null)}
            onMapInteraction={() => setListExpanded(false)}
            onVisibleWidthChange={handleVisibleWidthChange}
            searchedLocation={searchedLocation}
            activeLayer={activeLayer}
            listExpanded={listExpanded}
          />
        </Suspense>
      </ErrorBoundary>

      <StationListView
        stations={displayStations}
        filterCenter={filterCenter}
        userDistances={userDistances}
        unit={unit}
        onUnitChange={handleUnitChange}
        selectedDist={selectedDist}
        onDistChange={handleDistChange}
        onStationSelect={handleStationSelect}
        expanded={listExpanded}
        onExpandedChange={setListExpanded}
        fallbackStatus={fallbackListStatus}
        fallbackRadiusMi={FALLBACK_RADIUS_MI}
        isFetchingStations={isFetchingStations}
      />

      <AdBanner />

      {showError && query.status === "error" && (
        <ErrorToast
          message={query.message}
          onDismiss={() => setErrorDismissed(true)}
        />
      )}
    </>
  );
}
