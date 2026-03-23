/**
 * Returns a directions URL for the given coordinates.
 *
 * - iOS  → Apple Maps with cycling mode (dirflg=b)
 * - Else → Google Maps web/app with travelmode=bicycling
 *
 * Both URLs open the native map app on mobile when installed,
 * and fall back to the browser-based map otherwise.
 */
export function getDirectionsUrl(lat: number, lon: number): string {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    return `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=b`;
  }

  // Works on Android (opens Google Maps app if installed) and desktop
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=bicycling`;
}
