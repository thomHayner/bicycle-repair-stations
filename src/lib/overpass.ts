import type { OverpassNode, OverpassResponse } from "../types/overpass";

/**
 * Public Overpass mirrors tried in order when the primary endpoint fails.
 *
 * Browser fallbacks must serve `Access-Control-Allow-Origin: *`; mirrors that
 * don't (e.g. overpass.openstreetmap.ru) fail every request on CORS regardless
 * of server health and only add noise to the console. `overpass.kumi.systems`
 * is currently the only CORS-enabled mirror we trust enough to keep here — add
 * new entries only after verifying CORS from a browser origin.
 */
export const FALLBACK_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
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

  // Overpass returns HTTP 200 with a `remark` field on server-side timeouts
  if (json.remark && /timeout|runtime error/i.test(json.remark)) {
    throw new Error("Overpass API error: server timeout");
  }

  return json.elements;
}

function isRetryable(err: Error): boolean {
  // Network-level failures (offline, DNS, CORS) throw TypeError per Fetch spec
  if (err instanceof TypeError) return true;
  // Server-side Overpass timeout — worth trying another mirror
  if (err.message.includes("server timeout")) return true;
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
