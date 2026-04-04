import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import type { Map as LeafletMap, LatLng, LatLngBounds, FitBoundsOptions, ZoomPanOptions } from "leaflet";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStationQuery } from "../hooks/useStationQuery";
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

/**
 * Overlap between two bounds relative to the *smaller* of the two.
 * This keeps the threshold zoom-independent: "has ~30% of what I can
 * currently see scrolled away from the search area?" produces the same
 * physical-screen panning distance whether the user zoomed in or out
 * after the last search.
 */
function boundsOverlapRatio(a: LatLngBounds, b: LatLngBounds): number {
  const intWest  = Math.max(a.getWest(),  b.getWest());
  const intEast  = Math.min(a.getEast(),  b.getEast());
  const intSouth = Math.max(a.getSouth(), b.getSouth());
  const intNorth = Math.min(a.getNorth(), b.getNorth());
  if (intEast <= intWest || intNorth <= intSouth) return 0;
  const intArea = (intEast - intWest) * (intNorth - intSouth);
  const aArea   = (a.getEast() - a.getWest()) * (a.getNorth() - a.getSouth());
  const bArea   = (b.getEast() - b.getWest()) * (b.getNorth() - b.getSouth());
  const denom   = Math.min(aArea, bArea);
  return denom > 0 ? intArea / denom : 0;
}

export default function MapPage() {
  const geo = useGeolocation();
  const mapRef = useRef<LeafletMap | null>(null);

  // --- Programmatic movement tracking ---
  // Counter: incremented before flyTo/fitBounds, decremented on moveend — lets MapEventHandler
  // distinguish user-initiated moves from programmatic ones.
  const programmaticMoveRef = useRef(0);
  const programmaticFlyTo = useCallback((target: [number, number], zoom: number, options?: ZoomPanOptions) => {
    const map = mapRef.current;
    if (!map) return;
    programmaticMoveRef.current += 1;
    map.flyTo(target, zoom, options);
  }, []);
  const programmaticFitBounds = useCallback((bounds: [[number, number], [number, number]], options?: FitBoundsOptions) => {
    const map = mapRef.current;
    if (!map) return;
    programmaticMoveRef.current += 1;
    map.fitBounds(bounds, options);
  }, []);

  // --- "Search this area" viewport-overlap tracking ---
  const lastSearchBoundsRef = useRef<LatLngBounds | null>(null);
  const [mapMovedSinceSearch, setMapMovedSinceSearch] = useState(false);

  // Called by MapEventHandler when a programmatic flyTo/fitBounds settles —
  // snapshot the viewport as the new search baseline.
  const handleProgrammaticMoveEnd = useCallback(() => {
    lastSearchBoundsRef.current = mapRef.current?.getBounds() ?? null;
  }, []);

  // Called by MapEventHandler on user drag (every frame) and user moveend —
  // shows the button in real time as the user pans past the overlap threshold.
  // Cheap to call often: getBounds() is cached, the math is trivial, and
  // React short-circuits duplicate setState(true) calls.
  const handleUserMove = useCallback(() => {
    const last = lastSearchBoundsRef.current;
    const current = mapRef.current?.getBounds();
    if (!last || !current) return;
    if (boundsOverlapRatio(last, current) < 0.7) {
      setMapMovedSinceSearch(true);
    }
  }, []);

  // Location the user explicitly provided (geo or search) — drives Overpass fetches
  const [givenLocation, setGivenLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Set only on explicit user actions (typed search / "Search this area") — drives the search pin marker
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Last known map centre — fallback filter anchor when no givenLocation
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Distance filter — unit comes from global settings; selectedDist is local session state
  const { unit, setUnit } = useSettings();
  const [selectedDist, setSelectedDist] = useState(() => unit === "km" ? 5 : 2);
  const displayMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;

  const [activeLayer, setActiveLayer] = useState<LayerId>("cycling");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [initialFlyComplete, setInitialFlyComplete] = useState(false);

  const geoLat = geo.status === "resolved" ? geo.lat : null;
  const geoLng = geo.status === "resolved" ? geo.lng : null;
  const geoAcc = geo.status === "resolved" ? geo.accuracy : null;
  const userPosition = useMemo(
    () => (geoLat !== null && geoLng !== null ? { lat: geoLat, lng: geoLng, accuracy: geoAcc ?? undefined } : null),
    [geoLat, geoLng, geoAcc]
  );

  const locationDenied = geo.status === "denied";

  // Set givenLocation once geolocation resolves or is denied (only once — not on every watchPosition tick)
  useEffect(() => {
    if ((geo.status === "resolved" || geo.status === "denied") && !givenLocation) {
      const { lat, lng } = geo;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: latch location once on first geo resolve/deny
      setGivenLocation({ lat, lng });
      if (geo.status === "denied") {
        // No GPS — show the search pin at the fallback so user sees where we're searching
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

  const queryStations = query.status === "success" ? query.stations : undefined;
  const allStations = useMemo(
    () => queryStations ?? [],
    [queryStations]
  );

  // Auto-step-up: on each new givenLocation (with data loaded), find the smallest
  // radius ≥ 2 mi (5 km) that has at least 1 station, set it, and fitBounds.
  // Runs once per unique givenLocation; manual pill changes are never overridden.
  const autoRadiusLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (query.status !== "success") return;
    if (!givenLocation || allStations.length === 0) return;

    const prev = autoRadiusLocationRef.current;
    if (prev && prev.lat === givenLocation.lat && prev.lng === givenLocation.lng) return;
    autoRadiusLocationRef.current = givenLocation;

    // Candidates start at the 2-mi / 5-km default — never auto-select below that
    const options = unit === "mi" ? MI_OPTIONS : KM_OPTIONS;
    const defaultDist = unit === "mi" ? 2 : 5;
    const candidates = [...options].filter((d) => d >= defaultDist);

    const found = candidates.find((dist) => {
      const distMiles = unit === "km" ? dist / KM_PER_MILE : dist;
      return allStations.some(
        (s) => haversineDistanceMiles(s.lat, s.lon, givenLocation.lat, givenLocation.lng) <= distMiles
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
    programmaticFitBounds(
      [
        [givenLocation.lat - latDelta, givenLocation.lng - lngDelta],
        [givenLocation.lat + latDelta, givenLocation.lng + lngDelta],
      ],
      { padding: [40, 40], maxZoom: 16 }
    );
  }, [query.status, allStations, givenLocation, unit, programmaticFitBounds]);

  // Map pan updates the filter anchor (used only when no givenLocation)
  const handleMoveEnd = useCallback((center: LatLng) => {
    setMapCenter({ lat: center.lat, lng: center.lng });
    setErrorDismissed(false);
  }, []);

  const handleLocationFound = (pos: { lat: number; lng: number }, zoom = 13) => {
    setMapMovedSinceSearch(false);
    setGivenLocation(pos);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(pos.lat, pos.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : pos);
    setErrorDismissed(false);
    programmaticFlyTo([pos.lat, pos.lng], zoom, { duration: 1.2 });
  };

  // Recenter to GPS position — clears the search pin since the blue dot already marks the spot
  const handleRecenter = () => {
    if (!userPosition) return;
    setMapMovedSinceSearch(false);
    setGivenLocation(userPosition);
    setSearchedLocation(null);
    setErrorDismissed(false);
    programmaticFlyTo([userPosition.lat, userPosition.lng], 16, { duration: 1.2 });
  };

  const handleStationSelect = useCallback((station: OverpassNode) => {
    setSelectedStationId(station.id);
    setListExpanded(false);
    programmaticFlyTo([station.lat, station.lon], 17, { duration: 0.8 });
  }, [programmaticFlyTo]);

  const handleStationDeselect = useCallback(() => setSelectedStationId(null), []);

  const handleInitialFlyComplete = useCallback(() => setInitialFlyComplete(true), []);

  const handleMapInteraction = useCallback(() => setListExpanded(false), []);

  // Distance pill selected manually by the user
  const handleDistChange = (dist: number) => {
    setSelectedDist(dist);
  };

  // Unit toggle — snap selectedDist to the nearest preset in the new unit
  const handleUnitChange = (newUnit: Unit) => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    const currentMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;
    const converted = newUnit === "km" ? currentMiles * KM_PER_MILE : currentMiles;
    const options = newUnit === "km" ? KM_OPTIONS : MI_OPTIONS;
    const closest = [...options].reduce((a, b) =>
      Math.abs(b - converted) < Math.abs(a - converted) ? b : a
    );
    setSelectedDist(closest);
  };

  const isFetchingStations = query.status === "loading";

  const showOverlay =
    geo.status === "idle" ||
    geo.status === "loading" ||
    (geo.status === "resolved" && !initialFlyComplete);

  const showSearchHere = mapMovedSinceSearch;

  // When fresh results arrive, reset the "moved" flag and snapshot current viewport.
  // This covers cache hits (status jumps straight to "success") and network fetches alike.
  const prevGivenLocation = useRef(givenLocation);
  useEffect(() => {
    if (query.status === "success" && givenLocation !== prevGivenLocation.current) {
      prevGivenLocation.current = givenLocation;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: reset flag when search location changes with successful results
      setMapMovedSinceSearch(false);
      // Bounds snapshot is handled by handleProgrammaticMoveEnd when the flyTo/fitBounds settles,
      // but if the query resolved from cache without any programmatic move (e.g. same location),
      // snapshot now as a fallback.
      if (programmaticMoveRef.current === 0) {
        lastSearchBoundsRef.current = mapRef.current?.getBounds() ?? null;
      }
    }
  }, [query.status, givenLocation]);

  const handleSearchHere = () => {
    if (!mapCenter) return;
    setMapMovedSinceSearch(false);
    // Snapshot current viewport immediately so panning while results load
    // compares against where the user just searched, not the previous search.
    lastSearchBoundsRef.current = mapRef.current?.getBounds() ?? null;
    setGivenLocation(mapCenter);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(mapCenter.lat, mapCenter.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : mapCenter);
  };

  // Filter centre: explicit location (geo/search) → map centre → null
  const filterCenter = givenLocation ?? mapCenter;

  // Normal filtered view
  const filteredStations = useMemo(
    () =>
      filterCenter
        ? allStations.filter(
            (s) =>
              haversineDistanceMiles(s.lat, s.lon, filterCenter.lat, filterCenter.lng) <=
              displayMiles
          )
        : allStations,
    [allStations, filterCenter, displayMiles]
  );

  const displayStations = filteredStations;

  // Set of station IDs within the selected radius — used by MapView for icon selection
  const filteredStationIds = useMemo(
    () => new Set(filteredStations.map((s) => s.id)),
    [filteredStations]
  );

  // GPS distance from user to each station — computed once, shared by list and popups
  const userDistances = useMemo(
    () =>
      userPosition
        ? new Map(allStations.map((s) => [s.id, haversineDistanceMiles(userPosition.lat, userPosition.lng, s.lat, s.lon)]))
        : null,
    [userPosition, allStations]
  );

  const showError = query.status === "error" && !errorDismissed;

  const showPill = isFetchingStations || (showSearchHere && selectedStationId === null);

  return (
    <>
      <LoadingOverlay visible={showOverlay} />

      {showPill && (
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
            stations={allStations}
            filteredStationIds={filteredStationIds}
            onMoveEnd={handleMoveEnd}
            onUserMove={handleUserMove}
            onProgrammaticMoveEnd={handleProgrammaticMoveEnd}
            mapRef={mapRef}
            programmaticMoveRef={programmaticMoveRef}
            selectedStationId={selectedStationId}
            onStationSelect={handleStationSelect}
            onStationDeselect={handleStationDeselect}
            onMapInteraction={handleMapInteraction}
            searchedLocation={searchedLocation}
            activeLayer={activeLayer}
            listExpanded={listExpanded}
            onInitialFlyComplete={handleInitialFlyComplete}
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
        queryStatus={query.status}
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
