import { useEffect, useRef, useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { fetchStations } from "../lib/overpass";
import { ENV } from "../lib/env";
import { FETCH_RADIUS_KM, readCache, writeCache, isCovered } from "../lib/stationCache";
import { haversineDistanceMiles } from "../lib/distance";

/** 250 miles expressed in km — the maximum radius we search. */
export const FALLBACK_RADIUS_MI = 250;
const FALLBACK_RADIUS_KM = FALLBACK_RADIUS_MI * 1.60934;
const FALLBACK_TIMEOUT_S = 60;
const FALLBACK_COUNT = 5;

export type StationQueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; stations: OverpassNode[] }
  | { status: "escalating" }
  | { status: "success-wide"; stations: OverpassNode[]; farthestMi: number }
  | { status: "none" }
  | { status: "error"; message: string };

function computeFarthestMi(
  lat: number,
  lng: number,
  stations: OverpassNode[],
): number {
  return Math.max(
    ...stations.map((s) => haversineDistanceMiles(lat, lng, s.lat, s.lon)),
  );
}

function stateFromCache(
  lat: number,
  lng: number,
  stations: OverpassNode[],
  isWideFallback: boolean,
): StationQueryState {
  if (isWideFallback) {
    return {
      status: "success-wide",
      stations,
      farthestMi: computeFarthestMi(lat, lng, stations),
    };
  }
  return { status: "success", stations };
}

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
 * idle → loading → success (stations found nearby)
 *                → escalating → success-wide (5 nearest within 250 mi)
 *                             → none (nothing found anywhere)
 *       error
 *
 * Both primary and wide-area results are cached in the same "brs_v2"
 * localStorage entry. Wide-area entries are flagged with isWideFallback so
 * the hook knows to return success-wide on the next cache hit.
 */
export function useStationQuery(
  lat: number | null,
  lng: number | null,
): StationQueryState {
  const [state, setState] = useState<StationQueryState>(() => {
    const cached = readCache();
    if (!cached) return { status: "idle" };
    // We don't have lat/lng yet at init time, so we can't compute farthestMi.
    // Return success and let the effect re-derive success-wide once coords arrive.
    return { status: "success", stations: cached.stations };
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) return;

    // Cache hit — serve immediately
    const cached = readCache();
    if (cached && isCovered(lat, lng, cached)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- correct pattern
      setState(stateFromCache(lat, lng, cached.stations, !!cached.isWideFallback));
      return;
    }

    // Cache miss — fetch primary radius
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    fetchStations(lat, lng, FETCH_RADIUS_KM, ENV.OVERPASS_ENDPOINT, controller.signal)
      .then((stations) => {
        if (stations.length > 0) {
          writeCache({ center: { lat, lng }, radiusKm: FETCH_RADIUS_KM, stations, fetchedAt: Date.now() });
          setState({ status: "success", stations });
          return;
        }

        // Primary returned nothing — escalate to wide-area fetch
        setState({ status: "escalating" });

        fetchStations(
          lat, lng,
          FALLBACK_RADIUS_KM,
          ENV.OVERPASS_ENDPOINT,
          controller.signal,
          FALLBACK_TIMEOUT_S,
        )
          .then((all) => {
            if (all.length === 0) {
              setState({ status: "none" });
              return;
            }
            const sorted = [...all].sort(
              (a, b) =>
                haversineDistanceMiles(lat, lng, a.lat, a.lon) -
                haversineDistanceMiles(lat, lng, b.lat, b.lon),
            );
            const nearest = sorted.slice(0, FALLBACK_COUNT);
            const farthestMi = haversineDistanceMiles(lat, lng, nearest[nearest.length - 1].lat, nearest[nearest.length - 1].lon);
            writeCache({
              center: { lat, lng },
              radiusKm: FALLBACK_RADIUS_KM,
              stations: nearest,
              fetchedAt: Date.now(),
              isWideFallback: true,
            });
            setState({ status: "success-wide", stations: nearest, farthestMi });
          })
          .catch((err: Error) => {
            if (err.name === "AbortError") return;
            setState({ status: "none" });
          });
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
