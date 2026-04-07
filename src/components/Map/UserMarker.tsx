import { memo } from "react";
import { Marker, Circle, Tooltip } from "react-leaflet";
import { userIcon } from "../../lib/leafletConfig";

interface Props {
  lat: number;
  lng: number;
  accuracy?: number;
}

const ACCURACY_CIRCLE_OPTIONS = {
  color: "var(--color-secondary)",
  fillColor: "var(--color-secondary)",
  fillOpacity: 0.12,
  weight: 1,
} as const;

export const UserMarker = memo(function UserMarker({ lat, lng, accuracy }: Props) {
  return (
    <>
      {accuracy != null && accuracy < 5000 && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={ACCURACY_CIRCLE_OPTIONS}
        />
      )}
      <Marker
        position={[lat, lng]}
        icon={userIcon}
        zIndexOffset={1000}
        title="Your location"
        alt="Your location"
      >
        <Tooltip permanent={false} direction="top" offset={[0, -14]}>
          You are here
        </Tooltip>
      </Marker>
    </>
  );
});
