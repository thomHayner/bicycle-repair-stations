import { useEffect, useRef, useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { fetchStations } from "../lib/overpass";
import { ENV } from "../lib/env";
import { FETCH_RADIUS_KM, readCache, writeCache, isCovered } from "../lib/stationCache";

export type StationQueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; stations: OverpassNode[] }
  | { status: "none" }
  | { status: "error"; message: string };

function errorMessage(err: Error): string {
  if (err.message.includes("429"))
    return "Too many requests — please wait a moment and try again.";
  if (
    err.message.includes("504") ||
    err.message.includes("502") ||
    err.message.includes("503")
  )
    return "The map server is busy — please try again in a moment.";
  return err.message || "Failed to load stations. Check your connection.";
}

/**
 * Single hook that owns the full station-fetch lifecycle:
 *
 * idle → loading → success (stations found within 25 mi)
 *                → none    (nothing found within 25 mi)
 *       error
 *
 * Results are cached in localStorage ("brs_v3") for 24 hours.
 */
export function useStationQuery(
  lat: number | null,
  lng: number | null,
): StationQueryState {
  const [state, setState] = useState<StationQueryState>(() => {
    const cached = readCache();
    if (!cached) return { status: "idle" };
    return { status: "success", stations: cached.stations };
  });

  const abortRef = useRef<AbortController | null>(null);

  // --- Synchronous staleness detection (React "adjust state during render") ---
  // Detects coordinate changes DURING render so we can set "loading" before the
  // browser paints, eliminating the stale frame that flashes old data.
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  if (lat !== null && lng !== null) {
    const prev = lastCoordsRef.current;
    const coordsChanged = !prev || prev.lat !== lat || prev.lng !== lng;
    if (coordsChanged) {
      const cached = readCache();
      if (cached && isCovered(lat, lng, cached)) {
        // Cache covers new coords — serve immediately, no stale frame
        lastCoordsRef.current = { lat, lng };
        if (state.status !== "success" || state.stations !== cached.stations) {
          setState({ status: "success", stations: cached.stations });
        }
      } else if (state.status !== "loading" && state.status !== "idle") {
        // Coords changed, no cache coverage — force loading BEFORE paint
        setState({ status: "loading" });
      }
    }
  }

  useEffect(() => {
    if (lat === null || lng === null) return;

    // Update ref so render-time check knows these coords are handled
    lastCoordsRef.current = { lat, lng };

    // Cache hit — serve immediately
    const cached = readCache();
    if (cached && isCovered(lat, lng, cached)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern
      setState({ status: "success", stations: cached.stations });
      return;
    }

    // Cache miss — fetch 25-mile radius
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    fetchStations(lat, lng, FETCH_RADIUS_KM, ENV.OVERPASS_ENDPOINT, controller.signal)
      .then((stations) => {
        if (stations.length > 0) {
          writeCache({ center: { lat, lng }, radiusKm: FETCH_RADIUS_KM, stations, fetchedAt: Date.now() });
          setState({ status: "success", stations });
        } else {
          setState({ status: "none" });
        }
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setState({ status: "error", message: errorMessage(err) });
      });
  }, [lat, lng]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return state;
}
