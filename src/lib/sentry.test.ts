import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", async () => {
  const actual = await vi.importActual<typeof import("@sentry/react")>(
    "@sentry/react"
  );
  return {
    ...actual,
    init: vi.fn(),
    browserTracingIntegration: vi.fn(() => ({ name: "BrowserTracing" })),
    replayIntegration: vi.fn(() => ({ name: "Replay" })),
  };
});

async function importInitSentry() {
  vi.resetModules();
  return (await import("./sentry")).initSentry;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("initSentry", () => {
  it("is a no-op when VITE_SENTRY_DSN is not set", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const initSentry = await importInitSentry();
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("calls Sentry.init when a DSN is provided", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    const initSentry = await importInitSentry();
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it("configures replay masking and error-biased sampling", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    const initSentry = await importInitSentry();
    initSentry();

    const config = vi.mocked(Sentry.init).mock.calls[0][0];
    expect(config).toMatchObject({
      dsn: "https://example@sentry.io/1",
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
    });

    expect(Sentry.replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    });
  });

  it("propagates traces to the default Overpass primary, fallback mirrors, and Nominatim", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    const initSentry = await importInitSentry();
    initSentry();

    const targets = vi.mocked(Sentry.init).mock.calls[0][0]!
      .tracePropagationTargets as string[];
    expect(targets).toEqual(
      expect.arrayContaining([
        "overpass-api.de",
        "overpass.kumi.systems",
        "overpass.openstreetmap.ru",
        "nominatim.openstreetmap.org",
      ])
    );
  });

  it("includes the configured VITE_OVERPASS_ENDPOINT host in trace targets", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    vi.stubEnv("VITE_OVERPASS_ENDPOINT", "https://overpass.example.net/api/interpreter");
    const initSentry = await importInitSentry();
    initSentry();

    const targets = vi.mocked(Sentry.init).mock.calls[0][0]!
      .tracePropagationTargets as string[];
    expect(targets).toContain("overpass.example.net");
  });

  it("ignores a malformed VITE_OVERPASS_ENDPOINT without throwing", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    vi.stubEnv("VITE_OVERPASS_ENDPOINT", "not-a-url");
    const initSentry = await importInitSentry();
    expect(() => initSentry()).not.toThrow();

    const targets = vi.mocked(Sentry.init).mock.calls[0][0]!
      .tracePropagationTargets as string[];
    // Malformed primary is dropped silently; fallback mirrors and Nominatim remain.
    expect(targets).toEqual(
      expect.arrayContaining([
        "overpass.kumi.systems",
        "overpass.openstreetmap.ru",
        "nominatim.openstreetmap.org",
      ])
    );
    expect(targets).not.toContain("not-a-url");
  });
});
