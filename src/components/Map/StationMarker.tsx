import { memo, useEffect, useMemo, useRef } from "react";
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

export const StationMarker = memo(function StationMarker({ station, isSelected, isInRadius, onSelect, onDeselect, userDistances }: Props) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const map = useMap();

  // Disable Leaflet's auto-popup on marker click. The popup stays bound
  // (so programmatic openPopup() works), but clicking won't auto-open it.
  // We open it ourselves after the flyTo animation via the isSelected effect.
  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet internal: no typed API to unbind auto-popup
      marker.off('click', (marker as any)._openPopup, marker);
    }
  }, []);

  useEffect(() => {
    if (!isSelected || !markerRef.current) return;
    const marker = markerRef.current;

    // Open the popup once the flyTo animation has settled.
    // Guard: if the marker is absorbed into a cluster it won't be on the map.
    const handleMoveEnd = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet internal: _map is null when marker is clustered
      if (!(marker as any)._map) return;
      marker.openPopup();

      // Ensure the popup doesn't overlap the toolbar. Check the popup's top
      // edge in pixel space and pan the map down if it's too close.
      requestAnimationFrame(() => {
        const popup = marker.getPopup();
        if (!popup) return;
        const popupEl = popup.getElement();
        if (!popupEl) return;
        const topBarPx = 80; // toolbar height in px
        const padPx = 12;    // breathing room
        const popupRect = popupEl.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();
        const popupTopInMap = popupRect.top - mapRect.top;
        if (popupTopInMap < topBarPx + padPx) {
          map.panBy([0, popupTopInMap - (topBarPx + padPx)], { animate: true, duration: 0.3 });
        }
      });
    };
    map.once("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [isSelected, map]);

  const distMi = userDistances?.get(station.id) ?? null;
  const icon = isInRadius ? stationIcon : stationDotIcon;

  const eventHandlers = useMemo(() => ({
    // Don't deselect if the marker was just absorbed into a cluster
    popupclose: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet internal: _map is null when marker is clustered
      if ((markerRef.current as any)?._map) onDeselect();
    },
    click: () => onSelect(station),
  }), [onDeselect, onSelect, station]);

  return (
    <Marker
      ref={markerRef}
      position={[station.lat, station.lon]}
      icon={icon}
      eventHandlers={eventHandlers}
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
});
