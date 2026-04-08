import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Map as LeafletMap, LatLng } from "leaflet";
import type { OverpassNode } from "../../types/overpass";
import { UserMarker } from "./UserMarker";
import { SearchLocationMarker } from "./SearchLocationMarker";
import { StationMarker } from "./StationMarker";
import { createClusterIcon, createMutedClusterIcon } from "../../lib/leafletConfig";

import type { LayerId } from "../../lib/layers";
import { useSettings } from "../../context/useSettings";

interface MapEventHandlerProps {
  onMoveEnd: (center: LatLng) => void;
  onUserMove: () => void;
  onProgrammaticMoveEnd: () => void;
  onMapInteraction: () => void;
  programmaticMoveRef: React.MutableRefObject<number>;
}

function MapEventHandler({ onMoveEnd, onUserMove, onProgrammaticMoveEnd, onMapInteraction, programmaticMoveRef }: MapEventHandlerProps) {
  useMapEvents({
    click()    { onMapInteraction(); },
    dragstart(e){
      e.target.closePopup();
      onMapInteraction();
      // A user drag proves no programmatic animation is in flight.
      // Reset the counter to 0 in case a leaked increment is left over
      // (e.g. fitBounds interrupted flyTo, swallowing a moveend).
      programmaticMoveRef.current = 0;
    },
    drag()     { onUserMove(); },   // fires every frame during user pan — shows button mid-drag
    moveend(e) {
      onMoveEnd(e.target.getCenter());
      if (programmaticMoveRef.current > 0) {
        programmaticMoveRef.current -= 1;
        // Programmatic move just settled — snapshot bounds as the new search baseline
        onProgrammaticMoveEnd();
      } else {
        onUserMove();             // also check on release (catches zoom buttons, scroll wheel, etc.)
      }
    },
  });

  return null;
}

/**
 * Detects double-tap on touch devices and zooms the map.
 * Leaflet's built-in doubleClickZoom can miss touch double-taps when
 * `touch-action: manipulation` is set, because some browsers set
 * click.detail=2 without firing a native dblclick event.
 */
function DoubleTapZoom() {
  const map = useMap();
  const lastTapRef = useRef(0);
  const lastTapPosRef = useRef<{ x: number; y: number } | null>(null);

  // Touch: detect double-tap from touchend events
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) return; // ignore multi-touch (pinch)

    const now = Date.now();
    const touch = e.changedTouches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    const lastPos = lastTapPosRef.current;

    if (
      now - lastTapRef.current < 300 &&
      lastPos &&
      Math.abs(pos.x - lastPos.x) < 40 &&
      Math.abs(pos.y - lastPos.y) < 40
    ) {
      e.preventDefault();
      const containerPoint = map.mouseEventToContainerPoint(touch as unknown as MouseEvent);
      const latlng = map.containerPointToLatLng(containerPoint);
      map.setZoomAround(latlng, map.getZoom() + 1);
      lastTapRef.current = 0;
      lastTapPosRef.current = null;
    } else {
      lastTapRef.current = now;
      lastTapPosRef.current = pos;
    }
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();
    container.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => container.removeEventListener("touchend", handleTouchEnd);
  }, [map, handleTouchEnd]);

  // Mouse: handle native dblclick for desktop
  useMapEvents({
    dblclick(e) {
      map.setZoomAround(e.latlng, map.getZoom() + 1);
    },
  });

  return null;
}

// Renders the tile layer for the selected base map.
// Dark mode inversion is handled globally via CSS (.map-dark-tiles on the container),
// so this component is theme-agnostic — one path per layer, no dark branching.
// Must be a child of MapContainer so it has access to react-leaflet context.
function ActiveTileLayer({ layer }: { layer: LayerId }) {
  switch (layer) {
    case "satellite":
      // ESRI World Imagery base + CARTO Voyager labels overlay — both free, no key.
      // Not inverted in dark mode (satellite stays natural).
      return (
        <>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={20}
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
        </>
      );

    // case "terrain":
    //   // CARTO Dark Matter — free, no key.
    //   return (
    //     <TileLayer
    //       url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    //       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    //       subdomains="abcd"
    //       maxZoom={20}
    //     />
    //   );

    case "standard":
      // CARTO Voyager — free, no key. Clean English-label OSM rendering.
      return (
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
      );

    default: // "cycling"
      // CARTO Positron base + WaymarkedTrails cycling & MTB overlays — all free, no key.
      return (
        <>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          <TileLayer
            url="https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://cycling.waymarkedtrails.org">Waymarked Trails</a>'
            opacity={0.85}
            maxZoom={20}
          />
          <TileLayer
            url="https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://mtb.waymarkedtrails.org">Waymarked Trails MTB</a>'
            opacity={0.6}
            maxZoom={20}
          />
        </>
      );
  }
}

interface Props {
  userPosition: { lat: number; lng: number; accuracy?: number } | null;
  userDistances: Map<number, number> | null;
  stations: OverpassNode[];
  filteredStationIds: Set<number>;
  showMutedMarkers: boolean;
  onMoveEnd: (center: LatLng) => void;
  onUserMove: () => void;
  onProgrammaticMoveEnd: () => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
  programmaticMoveRef: React.MutableRefObject<number>;
  selectedStationId: number | null;
  onStationSelect: (station: OverpassNode) => void;
  onStationDeselect: () => void;
  onMapInteraction: () => void;
  searchedLocation: { lat: number; lng: number } | null;
  activeLayer: LayerId;
  listExpanded: boolean;
  onInitialFlyComplete?: () => void;
}

export const MapView = memo(function MapView({ userPosition, userDistances, stations, filteredStationIds, showMutedMarkers, onMoveEnd, onUserMove, onProgrammaticMoveEnd, mapRef, programmaticMoveRef, selectedStationId, onStationSelect, onStationDeselect, onMapInteraction, searchedLocation, activeLayer, onInitialFlyComplete }: Props) {
  const { resolvedTheme } = useSettings();
  const dark = resolvedTheme === "dark";
  // Background shown behind tiles while they load.
  // Satellite is never inverted, so its background stays at Leaflet's default (#ddd).
  // All other layers in dark mode: CSS filter inverts light tiles → near-black result.
  // #141414 ≈ the value you get from inverting a typical light-gray tile background.
  const tileBg = dark && activeLayer !== "satellite" ? "#141414" : undefined;

  const initialCenter = userPosition
    ? ([userPosition.lat, userPosition.lng] as [number, number])
    : ([51.505, -0.09] as [number, number]);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), [mapRef]);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), [mapRef]);

  const inRadiusStations = useMemo(
    () => stations.filter((s) => filteredStationIds.has(s.id)),
    [stations, filteredStationIds],
  );
  const outOfRadiusStations = useMemo(
    () => stations.filter((s) => !filteredStationIds.has(s.id)),
    [stations, filteredStationIds],
  );

  // Fly to user position once it resolves; signal completion so the splash screen can dismiss
  const didFlyRef = useRef(false);
  useEffect(() => {
    if (!userPosition || !mapRef.current || didFlyRef.current) return;
    didFlyRef.current = true;

    const map = mapRef.current;
    const target: [number, number] = [userPosition.lat, userPosition.lng];
    const targetZoom = 16;
    const currentCenter = map.getCenter();

    const alreadyThere =
      Math.abs(currentCenter.lat - target[0]) < 0.0001 &&
      Math.abs(currentCenter.lng - target[1]) < 0.0001 &&
      map.getZoom() === targetZoom;

    if (alreadyThere) {
      onInitialFlyComplete?.();
      return;
    }

    programmaticMoveRef.current += 1;
    map.once("moveend", () => onInitialFlyComplete?.());
    map.flyTo(target, targetZoom, { duration: 1.2 });
  }, [userPosition, mapRef, programmaticMoveRef, onInitialFlyComplete]);

  return (
    <div
      id="map-container"
      className={`fixed inset-0${dark && activeLayer !== "satellite" ? " map-dark-tiles" : ""}`}
      style={{ bottom: "var(--layout-map-bottom)", backgroundColor: tileBg }}
    >

      {/* Zoom controls stay fixed above collapsed list; expanded sheet overlays them */}
      <div
        className="fixed right-3 z-[850] flex flex-col rounded-full bg-[var(--color-surface-glass)] backdrop-blur-sm elevation-2 overflow-hidden"
        style={{ bottom: "calc(var(--layout-sheet-bottom) + var(--layout-sheet-collapsed) + 8px)" }}
      >
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={handleZoomIn}
          className="w-11 h-11 flex items-center justify-center text-[var(--color-text-secondary)] state-surface transition-colors focus-ring-inset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <div className="h-px bg-[var(--color-border)] mx-2" />
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={handleZoomOut}
          className="w-11 h-11 flex items-center justify-center text-[var(--color-text-secondary)] state-surface transition-colors focus-ring-inset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <MapContainer
        center={initialCenter}
        zoom={16}
        minZoom={5}
        maxZoom={18}
        style={{ width: "100%", height: "100%", background: tileBg }}
        zoomControl={false}
        preferCanvas={true}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={false}
        ref={mapRef}
        attributionControl={true}
      >
        <DoubleTapZoom />
        <ActiveTileLayer layer={activeLayer} />
        <MapEventHandler
          onMoveEnd={onMoveEnd}
          onUserMove={onUserMove}
          onProgrammaticMoveEnd={onProgrammaticMoveEnd}
          onMapInteraction={onMapInteraction}
          programmaticMoveRef={programmaticMoveRef}
        />
        {userPosition && (
          <UserMarker lat={userPosition.lat} lng={userPosition.lng} accuracy={userPosition.accuracy} />
        )}
        {searchedLocation && (
          <SearchLocationMarker lat={searchedLocation.lat} lng={searchedLocation.lng} />
        )}
        {/* In-radius stations — prominent clusters with counts */}
        <MarkerClusterGroup
          maxClusterRadius={60}
          disableClusteringAtZoom={16}
          iconCreateFunction={createClusterIcon}
          zoomToBoundsOnClick={true}
          spiderfyOnMaxZoom={false}
          showCoverageOnHover={false}
          animate={true}
          chunkedLoading={true}
        >
          {inRadiusStations.map((station) => (
            <StationMarker
              key={station.id}
              station={station}
              isSelected={station.id === selectedStationId}
              isInRadius={true}
              onSelect={onStationSelect}
              onDeselect={onStationDeselect}
              userDistances={userDistances}
            />
          ))}
        </MarkerClusterGroup>
        {/* Out-of-radius stations — small muted clusters, only shown for wide searches */}
        {showMutedMarkers && (
          <MarkerClusterGroup
            maxClusterRadius={60}
            disableClusteringAtZoom={16}
            iconCreateFunction={createMutedClusterIcon}
            zoomToBoundsOnClick={true}
            spiderfyOnMaxZoom={false}
            showCoverageOnHover={false}
            animate={true}
            chunkedLoading={true}
          >
            {outOfRadiusStations.map((station) => (
              <StationMarker
                key={station.id}
                station={station}
                isSelected={station.id === selectedStationId}
                isInRadius={false}
                onSelect={onStationSelect}
                onDeselect={onStationDeselect}
                userDistances={userDistances}
              />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
});
