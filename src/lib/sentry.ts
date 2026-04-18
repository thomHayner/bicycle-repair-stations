import * as Sentry from "@sentry/react";
import { ENV } from "./env";
import { FALLBACK_ENDPOINTS } from "./overpass";

const NOMINATIM_HOST = "nominatim.openstreetmap.org";

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function buildTracePropagationTargets(): Array<string | RegExp> {
  const hosts = new Set<string>([NOMINATIM_HOST]);
  for (const url of [ENV.OVERPASS_ENDPOINT, ...FALLBACK_ENDPOINTS]) {
    const host = safeHostname(url);
    if (host) hosts.add(host);
  }
  return Array.from(hosts);
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    tracePropagationTargets: buildTracePropagationTargets(),
    sendDefaultPii: false,
  });
}
