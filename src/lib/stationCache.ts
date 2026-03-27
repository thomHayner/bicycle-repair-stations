import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "./distance";

/**
 * Fetch radius in km. Large enough that the user can display up to 25 miles
 * (40 km) from their location and still have a ~25 km buffer before a
 * re-fetch is needed.
 *
 * Area ≈ π × 40² ≈ 5 000 sq miles — comfortably covers the "1 000 sq mile"
 * spirit while ensuring no edge-of-display gaps.
 */
export const FETCH_RADIUS_KM = 65;

/** Max displayable distance in km (25 miles ≈ 40.2 km). */
const MAX_DISPLAY_KM = 40.3;

/**
 * How far the user can move from the last fetch centre before we need to
 * re-fetch.  Anything closer is fully covered by the existing data.
 */
const REFETCH_THRESHOLD_KM = FETCH_RADIUS_KM - MAX_DISPLAY_KM; // ≈ 24.7 km

const STORAGE_KEY = "brs_v2";

/** Cache TTL: 24 hours in milliseconds */
const CACHE_TTL_MS = 86_400_000;

export interface StationCache {
  center: { lat: number; lng: number };
  radiusKm: number;
  stations: OverpassNode[];
  fetchedAt: number;
  /** True when this entry holds a wide-area fallback result (no stations found nearby). */
  isWideFallback?: boolean;
}

export function readCache(): StationCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as StationCache;
    // Expire after 24 hours so data doesn't go stale indefinitely
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

export function writeCache(data: StationCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or full — silently skip
  }
}

/**
 * Returns true if all stations within MAX_DISPLAY_KM of (lat, lng) are
 * guaranteed to be present in the cache.
 */
export function isCovered(lat: number, lng: number, cache: StationCache): boolean {
  const distKm =
    haversineDistanceMiles(lat, lng, cache.center.lat, cache.center.lng) * 1.60934;
  return distKm <= REFETCH_THRESHOLD_KM;
}
