const EARTH_RADIUS_MILES = 3958.8;

/** Haversine great-circle distance in miles between two lat/lng points. */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Approximate visible map width in miles from a longitude span and centre latitude.
 * Good enough for zoom-level detection without importing Leaflet.
 */
export function visibleWidthMiles(
  westLng: number,
  eastLng: number,
  centerLat: number
): number {
  const lngDiff = Math.abs(eastLng - westLng);
  const milesPerDegree = Math.cos((centerLat * Math.PI) / 180) * 69.172;
  return lngDiff * milesPerDegree;
}
