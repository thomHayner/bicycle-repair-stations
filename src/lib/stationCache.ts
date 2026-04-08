import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "./distance";

/**
 * Standard fetch radius in km — exactly 25 miles (25 × 1.60934).
 * Covers all local-range pills (1–25 mi). Wider pills trigger larger fetches.
 */
export const FETCH_RADIUS_KM = 40.2335; // 25 miles

/**
 * Re-fetch threshold: 20% of the fetch radius.
 * - 25 mi fetch → ~5 mi threshold (matches previous fixed value)
 * - 50 mi fetch → 10 mi, 100 mi → 20 mi, 250 mi → 50 mi
 */
function refetchThreshold(radiusKm: number): number {
  return radiusKm * 0.2;
}

// Bumped v2 → v3 to invalidate stale 65-km caches from the previous build.
const STORAGE_KEY = "brs_v3";

/** Cache TTL: 24 hours in milliseconds */
const CACHE_TTL_MS = 86_400_000;

export interface StationCache {
  center: { lat: number; lng: number };
  radiusKm: number;
  stations: OverpassNode[];
  fetchedAt: number;
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
 * Returns true if the cache covers a query at (lat, lng) for the given radius.
 * Checks both proximity to cache centre AND that the cached radius is sufficient.
 * A bigger cache always covers a smaller request (e.g. 100 mi cache covers 25 mi).
 */
export function isCovered(lat: number, lng: number, cache: StationCache, neededRadiusKm: number = FETCH_RADIUS_KM): boolean {
  const distKm =
    haversineDistanceMiles(lat, lng, cache.center.lat, cache.center.lng) * 1.60934;
  return distKm <= refetchThreshold(neededRadiusKm) && cache.radiusKm >= neededRadiusKm;
}
