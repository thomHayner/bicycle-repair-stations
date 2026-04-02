import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
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
  onMapInteraction: () => void;
}

function MapEventHandler({ onMoveEnd, onMapInteraction }: MapEventHandlerProps) {
  useMapEvents({
    click()    { onMapInteraction(); },
    dragstart(e){ e.target.closePopup(); onMapInteraction(); },
    moveend(e) {
      onMoveEnd(e.target.getCenter());
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
  onMoveEnd: (center: LatLng) => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
  selectedStationId: number | null;
  onStationSelect: (station: OverpassNode) => void;
  onStationDeselect: () => void;
  onMapInteraction: () => void;
  searchedLocation: { lat: number; lng: number } | null;
  activeLayer: LayerId;
  listExpanded: boolean;
}

export function MapView({ userPosition, userDistances, stations, filteredStationIds, onMoveEnd, mapRef, selectedStationId, onStationSelect, onStationDeselect, onMapInteraction, searchedLocation, activeLayer, listExpanded }: Props) {
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

  // Fly to user position once it resolves
  const didFlyRef = useRef(false);
  useEffect(() => {
    if (userPosition && mapRef.current && !didFlyRef.current) {
      mapRef.current.flyTo([userPosition.lat, userPosition.lng], 16, { duration: 1.2 });
      didFlyRef.current = true;
    }
  }, [userPosition, mapRef]);

  return (
    <div
      id="map-container"
      className={`fixed inset-0${dark && activeLayer !== "satellite" ? " map-dark-tiles" : ""}`}
      style={{ bottom: 50, backgroundColor: tileBg }}
    >

      {/* Zoom controls — sit above collapsed list handle; overlap is fine when list is open */}
      <div
        className="fixed right-3 z-[1000] flex flex-col rounded-full bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg overflow-hidden transition-[bottom] duration-300"
        style={{ bottom: listExpanded ? 92 : 120 }}
      >
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapRef.current?.zoomIn()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <MapContainer
        center={initialCenter}
        zoom={16}
        minZoom={10}
        maxZoom={18}
        style={{ width: "100%", height: "100%", background: tileBg }}
        zoomControl={false}
        preferCanvas={true}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
        ref={mapRef}
        attributionControl={true}
      >
        <ActiveTileLayer layer={activeLayer} />
        <MapEventHandler
          onMoveEnd={onMoveEnd}
          onMapInteraction={onMapInteraction}
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
          disableClusteringAtZoom={17}
          iconCreateFunction={createClusterIcon}
          zoomToBoundsOnClick={true}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          animate={true}
          chunkedLoading={true}
        >
          {stations.filter((s) => filteredStationIds.has(s.id)).map((station) => (
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
        {/* Out-of-radius cached stations — small muted clusters, no count */}
        <MarkerClusterGroup
          maxClusterRadius={60}
          disableClusteringAtZoom={17}
          iconCreateFunction={createMutedClusterIcon}
          zoomToBoundsOnClick={true}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          animate={true}
          chunkedLoading={true}
        >
          {stations.filter((s) => !filteredStationIds.has(s.id)).map((station) => (
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
      </MapContainer>
    </div>
  );
}
