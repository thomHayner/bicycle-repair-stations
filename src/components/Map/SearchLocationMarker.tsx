import { Marker, Tooltip } from "react-leaflet";
import { searchLocationIcon } from "../../lib/leafletConfig";

interface Props {
  lat: number;
  lng: number;
}

export function SearchLocationMarker({ lat, lng }: Props) {
  return (
    <Marker position={[lat, lng]} icon={searchLocationIcon} zIndexOffset={900}>
      <Tooltip permanent={false} direction="top" offset={[0, -38]}>
        Searching here
      </Tooltip>
    </Marker>
  );
}
