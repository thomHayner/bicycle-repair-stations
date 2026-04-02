import { useEffect, useRef } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { stationIcon, stationDotIcon } from "../../lib/leafletConfig";
import { StationPopup } from "./StationPopup";
import type { OverpassNode } from "../../types/overpass";

interface Props {
  station: OverpassNode;
  isSelected: boolean;
  isInRadius: boolean;
  onDeselect: () => void;
  userDistances: Map<number, number> | null;
}

export function StationMarker({ station, isSelected, isInRadius, onDeselect, userDistances }: Props) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!isSelected || !markerRef.current) return;
    const marker = markerRef.current;

    // Open the popup once the flyTo animation has settled.
    // Guard: if the marker is absorbed into a cluster it won't be on the map.
    const handleMoveEnd = () => {
      if ((marker as any)._map) marker.openPopup();
    };
    map.once("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [isSelected, map]);

  const distMi = userDistances?.get(station.id) ?? null;
  const icon = isInRadius ? stationIcon : stationDotIcon;

  return (
    <Marker
      ref={markerRef}
      position={[station.lat, station.lon]}
      icon={icon}
      eventHandlers={{
        popupclose: onDeselect,
        // Centre the map on the marker at the current zoom (no zoom change).
        // autoPan is disabled below so only one smooth movement fires.
        click: () =>
          map.flyTo([station.lat, station.lon], map.getZoom(), { duration: 0.8 }),
      }}
    >
      <Popup
        maxWidth={280}
        minWidth={200}
        autoPan={false}
        closeButton={false}
        autoClose={true}
        closeOnEscapeKey={true}
        closeOnClick={true}
      >
        <StationPopup station={station} distMi={distMi} />
      </Popup>
    </Marker>
  );
}
