export const ENV = {
  DEFAULT_RADIUS_KM: Number(import.meta.env.VITE_DEFAULT_RADIUS_KM ?? 2),
  FALLBACK_LAT: Number(import.meta.env.VITE_FALLBACK_LAT ?? 51.505),
  FALLBACK_LNG: Number(import.meta.env.VITE_FALLBACK_LNG ?? -0.09),
  OVERPASS_ENDPOINT: String(
    import.meta.env.VITE_OVERPASS_ENDPOINT ?? "https://overpass-api.de/api/interpreter"
  ),
} as const;
