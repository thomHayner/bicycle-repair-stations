export type ShareChannel = "x" | "facebook" | "email";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

const DEFAULT_SITE_URL = "https://bicyclerepairstations.com/";

export function getDefaultSharePayload(): SharePayload {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/`
    : DEFAULT_SITE_URL;

  return {
    title: "Find bicycle repair stations near you",
    text: "Find bicycle repair stations near you.",
    url,
  };
}

export function isNativeShareSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function withUtm(url: string, source: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", source);
    parsed.searchParams.set("utm_medium", "social");
    parsed.searchParams.set("utm_campaign", "app-share");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildChannelShareUrl(channel: ShareChannel, payload: SharePayload): string {
  const encodedText = encodeURIComponent(payload.text);
  const encodedTitle = encodeURIComponent(payload.title);

  if (channel === "x") {
    const encodedUrl = encodeURIComponent(withUtm(payload.url, "x"));
    return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }

  if (channel === "facebook") {
    const encodedUrl = encodeURIComponent(withUtm(payload.url, "facebook"));
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }

  const body = encodeURIComponent(`${payload.text}\n\n${withUtm(payload.url, "email")}`);
  return `mailto:?subject=${encodedTitle}&body=${body}`;
}

export async function copyShareLink(payload: SharePayload): Promise<void> {
  const url = withUtm(payload.url, "copy-link");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  throw new Error("Clipboard is not available on this device/browser.");
}

export function openShareUrl(url: string): void {
  if (typeof window === "undefined") return;
  const popup = window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
  if (!popup) {
    window.location.href = url;
  }
}
