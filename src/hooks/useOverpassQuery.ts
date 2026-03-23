import { useEffect, useRef, useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { fetchStations } from "../lib/overpass";
import { ENV } from "../lib/env";
import { FETCH_RADIUS_KM, readCache, writeCache, isCovered } from "../lib/stationCache";

type QueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; stations: OverpassNode[] }
  | { status: "error"; message: string };

export function useOverpassQuery(
  lat: number | null,
  lng: number | null
): QueryState {
  // Hydrate immediately from localStorage so the list is populated on mount
  const [state, setState] = useState<QueryState>(() => {
    const cached = readCache();
    if (cached) return { status: "success", stations: cached.stations };
    return { status: "idle" };
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) return;

    // Check whether the existing cache covers this location
    const cached = readCache();
    if (cached && isCovered(lat, lng, cached)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern: hydrate from cache hit
      setState({ status: "success", stations: cached.stations });
      return;
    }

    // Cache miss — fetch a fresh large-radius result
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    fetchStations(lat, lng, FETCH_RADIUS_KM, ENV.OVERPASS_ENDPOINT, controller.signal)
      .then((stations) => {
        writeCache({
          center: { lat, lng },
          radiusKm: FETCH_RADIUS_KM,
          stations,
          fetchedAt: Date.now(),
        });
        setState({ status: "success", stations });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        const message = err.message.includes("429")
          ? "Too many requests — please wait a moment and try again."
          : err.message.includes("504") || err.message.includes("502") || err.message.includes("503")
          ? "The map server is busy — please try again in a moment."
          : err.message || "Failed to load stations. Check your connection.";
        setState({ status: "error", message });
      });
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return state;
}
