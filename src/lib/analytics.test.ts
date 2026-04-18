import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: trackMock }));

async function importFresh() {
  vi.resetModules();
  return await import("./analytics");
}

describe("trackEvent", () => {
  beforeEach(() => {
    trackMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops in dev when debug flag is off", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_ANALYTICS_DEBUG", "");
    const { trackEvent } = await importFresh();
    trackEvent("locate_me_click");
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("forwards to @vercel/analytics in production", async () => {
    vi.stubEnv("PROD", true);
    const { trackEvent } = await importFresh();
    trackEvent("search_submit", { query_length: 7 });
    expect(trackMock).toHaveBeenCalledWith("search_submit", { query_length: 7 });
  });

  it("tracks in dev when VITE_ANALYTICS_DEBUG=true", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_ANALYTICS_DEBUG", "true");
    const { trackEvent } = await importFresh();
    trackEvent("menu_open");
    expect(trackMock).toHaveBeenCalledWith("menu_open", undefined);
  });

  it("swallows errors thrown by the underlying tracker", async () => {
    vi.stubEnv("PROD", true);
    trackMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { trackEvent } = await importFresh();
    expect(() => trackEvent("menu_open")).not.toThrow();
  });
});

describe("hostnameOf", () => {
  it("returns hostname for a well-formed URL", async () => {
    const { hostnameOf } = await importFresh();
    expect(hostnameOf("https://www.youtube.com/watch?v=xyz")).toBe("www.youtube.com");
  });

  it("returns 'unknown' for an un-parseable value", async () => {
    const { hostnameOf } = await importFresh();
    expect(hostnameOf("::::not-a-url::::")).toBe("unknown");
  });
});
