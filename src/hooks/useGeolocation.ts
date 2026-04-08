import { useEffect, useState } from "react";
import { ENV } from "../lib/env";

type GeolocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "resolved"; lat: number; lng: number; accuracy: number }
  | { status: "denied"; lat: number; lng: number; country?: string };

async function fetchIpGeo(): Promise<{ lat: number; lng: number; country: string }> {
  const res = await fetch("/api/geo");
  if (!res.ok) throw new Error("geo fetch failed");
  const data = await res.json();
  return { lat: data.lat, lng: data.lng, country: data.country };
}

function fallbackWithIpGeo(
  setState: React.Dispatch<React.SetStateAction<GeolocationState>>,
) {
  fetchIpGeo()
    .then(({ lat, lng, country }) => {
      setState({ status: "denied", lat, lng, country });
    })
    .catch(() => {
      setState({ status: "denied", lat: ENV.FALLBACK_LAT, lng: ENV.FALLBACK_LNG });
    });
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: set denied on unavailable API
      fallbackWithIpGeo(setState);
      return;
    }

    setState({ status: "loading" });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          status: "resolved",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        fallbackWithIpGeo(setState);
      },
      { maximumAge: 0, timeout: 10_000, enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
