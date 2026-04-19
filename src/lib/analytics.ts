import { track } from "@vercel/analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

/**
 * Canonical event names. Keeping them enumerated in one place makes it easy to
 * grep for a given surface and keeps the Vercel Analytics dashboard tidy —
 * every call site picks from this list rather than inventing ad-hoc names.
 */
export type EventName =
  // Share (landed previously in PR #22)
  | "share_opened"
  | "share_native_initiated"
  | "share_native_success"
  | "share_native_cancelled"
  | "share_native_failed"
  | "share_channel_clicked"
  | "share_copy_link"
  // Guides
  | "guide_video_click"
  | "guide_series_click"
  | "guide_footer_link_click"
  // Map / toolbar
  | "locate_me_click"
  | "search_submit"
  | "layer_change"
  | "marker_open"
  | "popup_directions_click"
  // Menu
  | "menu_open"
  | "menu_nav_click"
  | "external_link_click"
  // Settings
  | "theme_change"
  | "unit_change"
  | "locale_change"
  // Donate
  | "donate_cta_click"
  | "donate_success_view"
  // Bug report
  | "report_bug_submit";

function analyticsEnabled(): boolean {
  if (import.meta.env.PROD) return true;
  return import.meta.env.VITE_ANALYTICS_DEBUG === "true";
}

export function trackEvent(name: EventName, props?: AnalyticsProps): void {
  if (!analyticsEnabled()) return;
  try {
    track(name, props);
  } catch {
    // Never interrupt UX if analytics is unavailable.
  }
  if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === "true") {
    console.debug("[analytics]", name, props ?? {});
  }
}

/**
 * Extract a hostname from a URL for coarse external-link attribution.
 * Callers should never log the full href — only the host — so we avoid
 * accidentally capturing query strings that might contain user input.
 */
export function hostnameOf(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return "unknown";
  }
}
