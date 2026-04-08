export const ENV = {
  FALLBACK_LAT: Number(import.meta.env.VITE_FALLBACK_LAT ?? 40.015),
  FALLBACK_LNG: Number(import.meta.env.VITE_FALLBACK_LNG ?? -105.2705),
  OVERPASS_ENDPOINT: String(
    import.meta.env.VITE_OVERPASS_ENDPOINT ?? "https://overpass-api.de/api/interpreter"
  ),
} as const;
