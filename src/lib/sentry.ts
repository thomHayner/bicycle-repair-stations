import * as Sentry from "@sentry/react";

const OVERPASS_HOSTS = [
  /^https:\/\/overpass-api\.de\//,
  /^https:\/\/overpass\.kumi\.systems\//,
  /^https:\/\/overpass\.private\.coffee\//,
];

const NOMINATIM_HOST = /^https:\/\/nominatim\.openstreetmap\.org\//;

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
    tracePropagationTargets: [...OVERPASS_HOSTS, NOMINATIM_HOST],
    sendDefaultPii: false,
  });
}
