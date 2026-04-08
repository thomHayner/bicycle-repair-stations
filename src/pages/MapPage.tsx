import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
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
import { type Unit, KM_PER_MILE, MI_OPTIONS, KM_OPTIONS, MI_OPTIONS_ALL, KM_OPTIONS_ALL } from "../lib/units";
import { FETCH_RADIUS_KM } from "../lib/stationCache";
import { type LayerId } from "../lib/layers";
import { useSettings } from "../context/useSettings";
import type { OverpassNode } from "../types/overpass";
import { COUNTRY_TO_LOCALE, getDefaultUnit, type LocaleCode } from "../i18n/locales";

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
  const { t } = useTranslation("map");
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

  // Location the user explicitly provided (geo or search) — drives Overpass fetches
  const [givenLocation, setGivenLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Set only on explicit user actions (typed search / "Search this area") — drives the search pin marker
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Last known map centre — fallback filter anchor when no givenLocation
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Distance filter — unit comes from global settings; selectedDist is local session state
  const { unit, setUnit, setLocale } = useSettings();
  const [selectedDist, setSelectedDist] = useState(() => unit === "km" ? 5 : 2);

  // --- First-visit language prompt ---
  const isFirstVisit = !localStorage.getItem("brs-locale");
  const [languagePromptLocale, setLanguagePromptLocale] = useState<LocaleCode | null>(null);
  const [languageChosen, setLanguageChosen] = useState(false);

  // When geo resolves with a country on first visit, detect language + unit
  const appliedCountryRef = useRef(false);
  useEffect(() => {
    if (appliedCountryRef.current) return;
    if (geo.status !== "denied" || !("country" in geo) || !geo.country) return;
    appliedCountryRef.current = true;

    const country = geo.country;

    // Auto-detect unit on first visit
    if (!localStorage.getItem("brs-unit")) {
      const detectedUnit = getDefaultUnit(country);
      setUnit(detectedUnit);
    }

    // Determine if we should show a language prompt
    if (isFirstVisit) {
      const detected = COUNTRY_TO_LOCALE[country];
      if (detected && detected !== "en") {
        setLanguagePromptLocale(detected);
      }
    }
  }, [geo, isFirstVisit, setUnit]);

  const handleLocaleChosen = useCallback((locale: string) => {
    setLocale(locale);
    setLanguageChosen(true);
    setLanguagePromptLocale(null);
  }, [setLocale]);
  const displayMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;

  // Always show all pills (1–250 mi / 1–400 km)
  const distOptions = unit === "mi" ? MI_OPTIONS_ALL : KM_OPTIONS_ALL;

  // Fetch radius = max(standard 25 mi, selected distance in km)
  const selectedDistKm = unit === "mi" ? selectedDist * KM_PER_MILE : selectedDist;
  const fetchRadiusKm = Math.max(FETCH_RADIUS_KM, selectedDistKm);

  // Muted markers + wide search indicator only when viewing beyond standard range
  const isWideSearch = fetchRadiusKm > FETCH_RADIUS_KM;

  // --- "Search this area" viewport-overlap tracking ---
  const lastSearchBoundsRef = useRef<LatLngBounds | null>(null);
  const [mapMovedSinceSearch, setMapMovedSinceSearch] = useState(false);

  // Called by MapEventHandler when a programmatic flyTo/fitBounds settles —
  // snapshot the viewport as the new search baseline.
  const handleProgrammaticMoveEnd = useCallback(() => {
    lastSearchBoundsRef.current = mapRef.current?.getBounds() ?? null;
  }, []);

  // Called by MapEventHandler on user drag (every frame) and user moveend —
  // shows the button in real time as the user pans past the overlap threshold
  // OR zooms out beyond the fetched area.
  // Cheap to call often: getBounds() is cached, the math is trivial, and
  // React short-circuits duplicate setState(true) calls.
  const handleUserMove = useCallback(() => {
    const map = mapRef.current;
    const last = lastSearchBoundsRef.current;
    const current = map?.getBounds();
    if (!last || !current) return;

    // Pan check: has ~30% of the viewport scrolled away from the search area?
    if (boundsOverlapRatio(last, current) < 0.7) {
      setMapMovedSinceSearch(true);
      return;
    }

    // Zoom-out check: does the viewport show area beyond the *selected* radius?
    // Compare against the pill the user chose (displayMiles), not the cache/fetch
    // radius — so zooming out from 2 mi immediately offers "Search this area" at 5 mi.
    // Skip if already at the max pill (250 mi) — there's nothing bigger to search.
    const maxPillMi = MI_OPTIONS_ALL[MI_OPTIONS_ALL.length - 1];
    if (displayMiles < maxPillMi) {
      const center = map!.getCenter();
      const ne = current.getNorthEast();
      const viewportRadiusMi = haversineDistanceMiles(center.lat, center.lng, ne.lat, ne.lng);
      if (viewportRadiusMi > displayMiles * 1.3) {
        setMapMovedSinceSearch(true);
      }
    }
  }, [displayMiles]);

  const [activeLayer, setActiveLayer] = useState<LayerId>("cycling");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);

  // Track last successful selectedDist so we can revert on error (Fix 6)
  const lastSuccessDistRef = useRef(selectedDist);
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

  // Fires when givenLocation or fetchRadiusKm changes — never on map pan
  const query = useStationQuery(
    givenLocation?.lat ?? null,
    givenLocation?.lng ?? null,
    fetchRadiusKm,
  );
  const { retry } = query;

  // Preserve previous stations during loading so the list doesn't flash empty.
  // Google/Apple Maps pattern: old results stay visible with a pulsing header,
  // then swap in-place when the new data arrives.
  // Uses "adjust state during render" (same pattern as useStationQuery).
  const queryStations = query.status === "success" ? query.stations : undefined;
  const [staleStations, setStaleStations] = useState<OverpassNode[]>([]);
  if (queryStations && queryStations !== staleStations) {
    setStaleStations(queryStations);
  }
  const allStations = useMemo(
    () => queryStations ?? (query.status === "loading" || query.status === "error" ? staleStations : []),
    [queryStations, query.status, staleStations],
  );

  // Track whether the user has manually selected a radius this session.
  // When true, auto-radius is skipped so searches don't override the user's choice.
  // Resets naturally on page refresh (state, not persisted).
  const [userSelectedDist, setUserSelectedDist] = useState(false);

  // Auto-step-up: on each new givenLocation (with data loaded), find the smallest
  // radius ≥ 2 mi (5 km) that has at least 1 station, set it, and fitBounds.
  // Runs once per unique givenLocation; manual pill changes are never overridden.
  const autoRadiusLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (userSelectedDist) return; // user picked a radius — don't override
    if (!initialFlyComplete) return; // wait for initial map animation to finish
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
  }, [userSelectedDist, initialFlyComplete, query.status, allStations, givenLocation, unit, programmaticFitBounds]);

  // Map pan updates the filter anchor (used only when no givenLocation)
  const handleMoveEnd = useCallback((center: LatLng) => {
    setMapCenter({ lat: center.lat, lng: center.lng });
    setErrorDismissed(false);
  }, []);

  const handleLocationFound = useCallback((pos: { lat: number; lng: number }) => {
    setMapMovedSinceSearch(false);
    setGivenLocation(pos);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(pos.lat, pos.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : pos);
    setErrorDismissed(false);
    // Zoom to show the selected radius, not a fixed zoom level
    const distMiles = displayMiles;
    const DEG_PER_MILE = 1 / 69;
    const latDelta = distMiles * DEG_PER_MILE;
    const lngDelta = latDelta / Math.cos((pos.lat * Math.PI) / 180);
    programmaticFitBounds(
      [
        [pos.lat - latDelta, pos.lng - lngDelta],
        [pos.lat + latDelta, pos.lng + lngDelta],
      ],
      { padding: [40, 40], maxZoom: 16 }
    );
  }, [userPosition, displayMiles, programmaticFitBounds]);

  // Recenter to GPS position — clears the search pin since the blue dot already marks the spot
  const handleRecenter = useCallback(() => {
    if (!userPosition) return;
    setMapMovedSinceSearch(false);
    setGivenLocation(userPosition);
    setSearchedLocation(null);
    setErrorDismissed(false);
    programmaticFlyTo([userPosition.lat, userPosition.lng], 16, { duration: 1.2 });
  }, [userPosition, programmaticFlyTo]);

  const handleStationSelect = useCallback((station: OverpassNode) => {
    setSelectedStationId(station.id);
    setListExpanded(false);
    programmaticFlyTo([station.lat, station.lon], 17, { duration: 0.8 });
  }, [programmaticFlyTo]);

  const handleStationDeselect = useCallback(() => setSelectedStationId(null), []);

  const handleInitialFlyComplete = useCallback(() => setInitialFlyComplete(true), []);

  // Fix 8: Safety net — if MapView chunk fails to load or flyTo never fires,
  // force the overlay away after 15 seconds to avoid a permanent spinner.
  useEffect(() => {
    if (initialFlyComplete) return;
    const timer = setTimeout(() => setInitialFlyComplete(true), 15_000);
    return () => clearTimeout(timer);
  }, [initialFlyComplete]);

  const handleMapInteraction = useCallback(() => setListExpanded(false), []);

  // Distance pill selected manually by the user
  const handleDistChange = useCallback((dist: number) => {
    setUserSelectedDist(true);
    setSelectedDist(dist);
  }, []);

  // Unit toggle — snap selectedDist to the nearest preset in the new unit (full range)
  const handleUnitChange = useCallback((newUnit: Unit) => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    const currentMiles = unit === "mi" ? selectedDist : selectedDist / KM_PER_MILE;
    const converted = newUnit === "km" ? currentMiles * KM_PER_MILE : currentMiles;
    const options = newUnit === "km" ? KM_OPTIONS_ALL : MI_OPTIONS_ALL;
    const closest = [...options].reduce((a, b) =>
      Math.abs(b - converted) < Math.abs(a - converted) ? b : a
    );
    setSelectedDist(closest);
  }, [unit, setUnit, selectedDist]);

  const isFetchingStations = query.status === "loading";

  const showOverlay =
    geo.status === "idle" ||
    geo.status === "loading" ||
    (geo.status === "resolved" && !initialFlyComplete) ||
    (languagePromptLocale !== null && !languageChosen);

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

  // Fix 5: Restore "Search this area" FAB after error so user can retry
  useEffect(() => {
    if (query.status === "error") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: surface retry affordance when fetch fails
      setMapMovedSinceSearch(true);
    }
  }, [query.status]);

  // Fix 6: Track last successful distance; revert pill on error
  useEffect(() => {
    if (query.status === "success") {
      lastSuccessDistRef.current = selectedDist;
    } else if (query.status === "error" && selectedDist !== lastSuccessDistRef.current) {
      setSelectedDist(lastSuccessDistRef.current);
    }
  }, [query.status, selectedDist]);

  const handleSearchHere = useCallback(() => {
    if (!mapCenter) return;
    setMapMovedSinceSearch(false);
    // Snapshot current viewport immediately so panning while results load
    // compares against where the user just searched, not the previous search.
    lastSearchBoundsRef.current = mapRef.current?.getBounds() ?? null;

    // Snap selectedDist to the closest pill matching the visible viewport radius
    const map = mapRef.current;
    if (map) {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const ne = bounds.getNorthEast();
      const viewportRadiusMi = haversineDistanceMiles(center.lat, center.lng, ne.lat, ne.lng);
      const opts = unit === "mi" ? MI_OPTIONS_ALL : KM_OPTIONS_ALL;
      const viewportDist = unit === "km" ? viewportRadiusMi * KM_PER_MILE : viewportRadiusMi;
      const closest = [...opts].reduce((a, b) =>
        Math.abs(b - viewportDist) < Math.abs(a - viewportDist) ? b : a
      );
      setSelectedDist(closest);
      setUserSelectedDist(true);
    }

    setGivenLocation(mapCenter);
    const nearUser =
      userPosition !== null &&
      haversineDistanceMiles(mapCenter.lat, mapCenter.lng, userPosition.lat, userPosition.lng) < 1;
    setSearchedLocation(nearUser ? null : mapCenter);
    // Ensure the fetch re-runs even at the same coordinates (same-location retry after error)
    retry();
  }, [mapCenter, userPosition, unit, retry]);

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
      <LoadingOverlay
        visible={showOverlay}
        suggestedLocale={languagePromptLocale}
        onLocaleChosen={handleLocaleChosen}
      />

      {showPill && (
        <div
          className="fixed left-0 right-0 z-[999] flex justify-center pointer-events-none transition-[top] duration-200"
          style={{ top: locationDenied ? 112 : 80 }}
        >
          {/* Grid container = pill shell; both variants overlap at col/row 1 so pill never resizes */}
          <div className="grid bg-[var(--color-surface-glass)] backdrop-blur-sm elevation-2 border border-[var(--color-border)] rounded-full text-sm font-semibold text-slate-800 dark:text-slate-100">

            {/* Loading variant: [spinner] [text] [invisible 15px spacer] */}
            <div
              className={`col-start-1 row-start-1 flex items-center gap-2 px-4 py-2 pointer-events-none transition-opacity duration-150 ${showSearchHere ? "opacity-0" : "opacity-100"}`}
              aria-hidden={showSearchHere}
            >
              <span className="inline-block w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin shrink-0" />
              {isWideSearch ? t("searchingWiderArea") : t("loadingStations")}
              <span className="w-[15px] h-[15px] shrink-0 invisible" aria-hidden="true" />
            </div>

            {/* Search variant: [spinner-reserved] [text] [search icon] */}
            <button
              onClick={handleSearchHere}
              tabIndex={showSearchHere ? 0 : -1}
              aria-hidden={!showSearchHere}
              className={`col-start-1 row-start-1 flex items-center gap-2 px-4 py-2 rounded-full state-surface focus-ring transition-opacity duration-150 ${showSearchHere ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            >
              <span className={`inline-block w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full shrink-0 ${isFetchingStations ? "animate-spin" : "invisible"}`} />
              {t("searchThisArea")}
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
            showMutedMarkers={isWideSearch}
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
        distOptions={distOptions}
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
