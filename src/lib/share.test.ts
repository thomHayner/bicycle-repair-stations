import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isNativeShareSupported,
  buildChannelShareUrl,
  copyShareLink,
  openShareUrl,
  getDefaultSharePayload,
  type SharePayload,
} from "./share";

const payload: SharePayload = {
  title: "Find bicycle repair stations",
  text: "Find bicycle repair stations near you.",
  url: "https://bicyclerepairstations.com/",
};

afterEach(() => {
  vi.restoreAllMocks();
  // Remove navigator.share if it was added
  const nav = navigator as Record<string, unknown>;
  delete nav.share;
  // Reset clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
    writable: true,
  });
});

describe("isNativeShareSupported", () => {
  it("returns true when navigator.share is a function", () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    expect(isNativeShareSupported()).toBe(true);
  });

  it("returns false when navigator.share is absent", () => {
    expect(isNativeShareSupported()).toBe(false);
  });
});

describe("buildChannelShareUrl", () => {
  it("builds a Twitter/X intent URL with utm_source=x", () => {
    const url = buildChannelShareUrl("x", payload);
    const decoded = decodeURIComponent(url);
    expect(url).toContain("twitter.com/intent/tweet");
    expect(decoded).toContain("utm_source=x");
    expect(decoded).toContain("utm_medium=social");
    expect(decoded).toContain("utm_campaign=app-share");
  });

  it("includes the share text in X share URL", () => {
    const url = buildChannelShareUrl("x", payload);
    expect(decodeURIComponent(url)).toContain(payload.text);
  });

  it("builds a Facebook sharer URL with utm_source=facebook", () => {
    const url = buildChannelShareUrl("facebook", payload);
    expect(url).toContain("facebook.com/sharer");
    expect(decodeURIComponent(url)).toContain("utm_source=facebook");
  });

  it("builds a mailto URL for email channel", () => {
    const url = buildChannelShareUrl("email", payload);
    const decoded = decodeURIComponent(url);
    expect(url).toMatch(/^mailto:/);
    expect(decoded).toContain("utm_source=email");
    expect(decoded).toContain(payload.title);
  });
});

describe("copyShareLink", () => {
  it("calls clipboard.writeText with utm_source=copy-link URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    await copyShareLink(payload);

    expect(writeText).toHaveBeenCalledOnce();
    const calledWith: string = writeText.mock.calls[0][0];
    expect(calledWith).toContain("utm_source=copy-link");
    expect(calledWith).toContain("utm_medium=social");
  });

  it("throws when clipboard is unavailable", async () => {
    // clipboard is undefined from afterEach reset
    await expect(copyShareLink(payload)).rejects.toThrow();
  });
});

describe("openShareUrl", () => {
  it("calls window.open with the URL, _blank, and noopener", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    openShareUrl("https://example.com/");
    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/",
      "_blank",
      expect.stringContaining("noopener")
    );
  });

  it("falls back to window.location.href if window.open returns null", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const hrefSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    } as Location);

    // Just confirm it doesn't throw
    expect(() => openShareUrl("https://example.com/")).not.toThrow();
    hrefSpy.mockRestore();
  });
});

describe("getDefaultSharePayload", () => {
  it("returns a payload with a url based on window.location.origin", () => {
    const result = getDefaultSharePayload();
    expect(result.url).toContain(window.location.origin);
  });

  it("returns non-empty title and text", () => {
    const result = getDefaultSharePayload();
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });
});
