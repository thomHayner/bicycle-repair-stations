import { useEffect, useState } from "react";
import { ENV } from "../lib/env";

type GeolocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "resolved"; lat: number; lng: number; accuracy: number }
  | { status: "denied"; lat: number; lng: number };

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: set denied on unavailable API
      setState({ status: "denied", lat: ENV.FALLBACK_LAT, lng: ENV.FALLBACK_LNG });
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
        setState({
          status: "denied",
          lat: ENV.FALLBACK_LAT,
          lng: ENV.FALLBACK_LNG,
        });
      },
      { maximumAge: 0, timeout: 10_000, enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
