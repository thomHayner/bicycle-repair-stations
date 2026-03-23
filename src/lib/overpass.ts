import type { OverpassNode, OverpassResponse } from "../types/overpass";

/** Public Overpass mirrors tried in order when the primary endpoint fails. */
const FALLBACK_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

/** HTTP status codes that indicate server overload — worth retrying elsewhere. */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export function buildOverpassQuery(lat: number, lon: number, radiusM: number, timeoutS = 25): string {
  return `[out:json][timeout:${timeoutS}];node["amenity"="bicycle_repair_station"](around:${radiusM},${lat},${lon});out body;`;
}

async function tryEndpoint(
  endpoint: string,
  body: string,
  signal?: AbortSignal
): Promise<OverpassNode[]> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: HTTP ${res.status}`);
  }

  const json: OverpassResponse = await res.json();
  return json.elements;
}

function isRetryable(err: Error): boolean {
  return RETRYABLE_STATUSES.has(
    Number(err.message.match(/HTTP (\d+)/)?.[1] ?? 0)
  );
}

export async function fetchStations(
  lat: number,
  lon: number,
  radiusKm: number,
  endpoint: string,
  signal?: AbortSignal,
  timeoutS = 25,
): Promise<OverpassNode[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = buildOverpassQuery(lat, lon, radiusM, timeoutS);
  const body = `data=${encodeURIComponent(query)}`;

  // Try the primary endpoint first
  try {
    return await tryEndpoint(endpoint, body, signal);
  } catch (primaryErr) {
    // Re-throw immediately for abort and non-retryable errors
    if ((primaryErr as Error).name === "AbortError") throw primaryErr;
    if (!isRetryable(primaryErr as Error)) throw primaryErr;
  }

  // Primary timed out or was overloaded — try each fallback mirror in order
  let lastErr: Error = new Error("All Overpass endpoints failed");
  for (const fallback of FALLBACK_ENDPOINTS) {
    try {
      return await tryEndpoint(fallback, body, signal);
    } catch (fallbackErr) {
      if ((fallbackErr as Error).name === "AbortError") throw fallbackErr;
      lastErr = fallbackErr as Error;
      if (!isRetryable(lastErr)) throw lastErr;
      // Retryable — try the next mirror
    }
  }

  throw lastErr;
}
