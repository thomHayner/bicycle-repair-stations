import { useCallback, useEffect, useRef, useState } from "react";
import i18n from "../i18n";
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

export type StationQueryResult = StationQueryState & {
  /** Increment to re-run the fetch at the same coordinates (retry after error). */
  retry: () => void;
};

function errorMessage(err: Error): string {
  const t = i18n.t.bind(i18n);
  if (err.message.includes("429"))
    return t("map:errorTooManyRequests");
  if (
    err.message.includes("504") ||
    err.message.includes("502") ||
    err.message.includes("503")
  )
    return t("map:errorServerBusy");
  if (err.message.includes("server timeout"))
    return t("map:errorTimeout");
  if (err instanceof TypeError)
    return t("map:errorNetwork");
  return err.message || t("map:errorGeneric");
}

/**
 * Single hook that owns the full station-fetch lifecycle:
 *
 * idle → loading → success (stations found within fetch radius)
 *                → none    (nothing found within fetch radius)
 *       error
 *
 * Results are cached in localStorage ("brs_v3") for 24 hours.
 * The caller controls the fetch radius (defaults to 25 mi / FETCH_RADIUS_KM).
 */
export function useStationQuery(
  lat: number | null,
  lng: number | null,
  fetchRadiusKm: number = FETCH_RADIUS_KM,
): StationQueryResult {
  const [state, setState] = useState<StationQueryState>(() => {
    const cached = readCache();
    if (!cached) return { status: "idle" };
    return { status: "success", stations: cached.stations };
  });

  // Incrementing retryTick re-runs the fetch even at the same coordinates.
  const [retryTick, setRetryTick] = useState(0);
  const retry = useCallback(() => setRetryTick((t) => t + 1), []);

  const abortRef = useRef<AbortController | null>(null);

  // --- Synchronous staleness detection (React "adjust state during render") ---
  // Tracks the last coordinates we computed state for. When coords change during
  // render, we set "loading" BEFORE the browser paints, eliminating the stale
  // frame that flashes old data. Uses state (not ref) per React docs.
  const [prevCoords, setPrevCoords] = useState<{ lat: number; lng: number } | null>(null);
  if (lat !== null && lng !== null) {
    const coordsChanged = !prevCoords || prevCoords.lat !== lat || prevCoords.lng !== lng;
    if (coordsChanged) {
      const cached = readCache();
      if (cached && isCovered(lat, lng, cached, fetchRadiusKm)) {
        // Cache covers new coords — serve immediately, no stale frame
        setPrevCoords({ lat, lng });
        if (state.status !== "success" || state.stations !== cached.stations) {
          setState({ status: "success", stations: cached.stations });
        }
      } else if (state.status !== "loading" && state.status !== "idle") {
        // Coords changed, no cache coverage — force loading BEFORE paint
        setPrevCoords({ lat, lng });
        setState({ status: "loading" });
      }
    }
  }

  useEffect(() => {
    if (lat === null || lng === null) return;

    // Cache hit — serve immediately
    const cached = readCache();
    if (cached && isCovered(lat, lng, cached, fetchRadiusKm)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- early return: cache hit avoids fetch
      setState({ status: "success", stations: cached.stations });
      return;
    }

    // Cache miss — fetch requested radius
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    const timeoutS = Math.min(90, Math.max(25, Math.round(fetchRadiusKm / FETCH_RADIUS_KM * 25)));
    fetchStations(lat, lng, fetchRadiusKm, ENV.OVERPASS_ENDPOINT, controller.signal, timeoutS)
      .then((stations) => {
        if (stations.length > 0) {
          writeCache({ center: { lat, lng }, radiusKm: fetchRadiusKm, stations, fetchedAt: Date.now() });
          setState({ status: "success", stations });
        } else {
          setState({ status: "none" });
        }
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setState({ status: "error", message: errorMessage(err) });
      });
  }, [lat, lng, fetchRadiusKm, retryTick]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return { ...state, retry };
}
