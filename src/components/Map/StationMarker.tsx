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
  onSelect: (station: OverpassNode) => void;
  onDeselect: () => void;
  userDistances: Map<number, number> | null;
}

export function StationMarker({ station, isSelected, isInRadius, onSelect, onDeselect, userDistances }: Props) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const map = useMap();

  // Disable Leaflet's auto-popup on marker click. The popup stays bound
  // (so programmatic openPopup() works), but clicking won't auto-open it.
  // We open it ourselves after the flyTo animation via the isSelected effect.
  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.off('click', (marker as any)._openPopup, marker);
    }
  }, []);

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
        // Don't deselect if the marker was just absorbed into a cluster
        popupclose: () => {
          if ((markerRef.current as any)?._map) onDeselect();
        },
        click: () => onSelect(station),
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
