import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "./distance";

/**
 * Standard fetch radius in km — exactly 25 miles (25 × 1.60934).
 * Covers all local-range pills (1–25 mi). Wider pills trigger larger fetches.
 */
export const FETCH_RADIUS_KM = 40.2335; // 25 miles



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
 * Geometric check: the entire needed circle must fit inside the cached circle.
 * A bigger cache always covers a smaller request (e.g. 100 mi cache covers 25 mi)
 * and tolerates more movement before triggering a re-fetch.
 */
export function isCovered(lat: number, lng: number, cache: StationCache, neededRadiusKm: number = FETCH_RADIUS_KM): boolean {
  const distKm =
    haversineDistanceMiles(lat, lng, cache.center.lat, cache.center.lng) * 1.60934;
  return distKm + neededRadiusKm <= cache.radiusKm;
}
