import { useEffect, useRef, useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { fetchStations } from "../lib/overpass";
import { ENV } from "../lib/env";
import { haversineDistanceMiles } from "../lib/distance";

/** 1 000 miles expressed in km — the maximum radius we search. */
export const FALLBACK_RADIUS_MI = 1000;
export const FALLBACK_RADIUS_KM = FALLBACK_RADIUS_MI * 1.60934;

const FALLBACK_TIMEOUT_S = 60;
const FALLBACK_COUNT = 5;

export type FallbackState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; stations: OverpassNode[]; farthestMi: number }
  | { status: "none" };

/**
 * When `enabled` is true, searches up to 1 000 miles for the nearest stations.
 * Returns the closest `FALLBACK_COUNT` stations and the distance to the farthest one.
 * Resets to "idle" whenever `enabled` becomes false (e.g. a new primary query starts).
 */
export function useFallbackQuery(
  lat: number | null,
  lng: number | null,
  enabled: boolean,
): FallbackState {
  const [state, setState] = useState<FallbackState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || lat === null || lng === null) {
      abortRef.current?.abort();
      abortRef.current = null;
      setState({ status: "idle" });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

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
        const last = nearest[nearest.length - 1];
        const farthestMi = haversineDistanceMiles(lat, lng, last.lat, last.lon);
        setState({ status: "success", stations: nearest, farthestMi });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        // Treat any fetch error as "nothing found" — don't surface a second error banner
        setState({ status: "none" });
      });
  }, [lat, lng, enabled]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return state;
}
