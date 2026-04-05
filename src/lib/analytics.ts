import { track } from "@vercel/analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, props?: AnalyticsProps): void {
  try {
    track(name, props);
  } catch {
    // Never interrupt UX if analytics is unavailable.
  }
}
