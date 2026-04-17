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

  it("propagates traces to Overpass and Nominatim only", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
    const initSentry = await importInitSentry();
    initSentry();

    const targets = vi.mocked(Sentry.init).mock.calls[0][0]!
      .tracePropagationTargets as RegExp[];
    expect(targets.some((r) => r.test("https://overpass-api.de/api/interpreter"))).toBe(true);
    expect(targets.some((r) => r.test("https://nominatim.openstreetmap.org/search"))).toBe(true);
    expect(targets.some((r) => r.test("https://example.com/unrelated"))).toBe(false);
  });
});
