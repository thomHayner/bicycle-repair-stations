/** Format a distance value using the active locale's number conventions. */
export function formatDistance(value: number, locale: string): string {
  if (value < 0.1) return "<0.1";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}
