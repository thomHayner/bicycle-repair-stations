import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "./distance";

/**
 * Fetch radius in km — exactly 25 miles (25 × 1.60934).
 * Matches the maximum selectable display radius so we cache exactly what
 * the user can request to see.
 */
export const FETCH_RADIUS_KM = 40.2335; // 25 miles

/**
 * How far the user can move from the last fetch centre before we need to
 * re-fetch. Fixed at 5 miles — independent of the display radius.
 */
const REFETCH_THRESHOLD_KM = 8.047; // 5 miles

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
 * Returns true if (lat, lng) is within REFETCH_THRESHOLD_KM of the cache
 * centre, meaning the cached data fully covers the 25-mile display radius.
 */
export function isCovered(lat: number, lng: number, cache: StationCache): boolean {
  const distKm =
    haversineDistanceMiles(lat, lng, cache.center.lat, cache.center.lng) * 1.60934;
  return distKm <= REFETCH_THRESHOLD_KM;
}
