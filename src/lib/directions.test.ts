import { describe, it, expect, vi, afterEach } from "vitest";
import { getDirectionsUrl } from "./directions";

afterEach(() => {
  vi.restoreAllMocks();
});

const iPhoneUA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const iPadUA =
  "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const iPodUA =
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const androidUA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/114.0 Mobile Safari/537.36";
const desktopUA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36";

describe("getDirectionsUrl", () => {
  it("returns Apple Maps URL on iPhone", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(iPhoneUA);
    const url = getDirectionsUrl(51.5, -0.1);
    expect(url).toContain("maps.apple.com");
    expect(url).toContain("daddr=51.5,-0.1");
    expect(url).toContain("dirflg=b");
  });

  it("returns Apple Maps URL on iPad", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(iPadUA);
    const url = getDirectionsUrl(40.0, -105.27);
    expect(url).toContain("maps.apple.com");
    expect(url).toContain("dirflg=b");
  });

  it("returns Apple Maps URL on iPod touch", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(iPodUA);
    const url = getDirectionsUrl(48.8566, 2.3522);
    expect(url).toContain("maps.apple.com");
  });

  it("returns Google Maps URL on Android", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(androidUA);
    const url = getDirectionsUrl(51.5, -0.1);
    expect(url).toContain("google.com/maps");
    expect(url).toContain("travelmode=bicycling");
    expect(url).toContain("destination=51.5,-0.1");
  });

  it("returns Google Maps URL on desktop Chrome", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(desktopUA);
    const url = getDirectionsUrl(40.7128, -74.006);
    expect(url).toContain("google.com/maps");
    expect(url).toContain("travelmode=bicycling");
  });

  it("embeds coordinates correctly in Apple Maps URL", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(iPhoneUA);
    const url = getDirectionsUrl(37.7749, -122.4194);
    expect(url).toContain("37.7749,-122.4194");
  });

  it("embeds coordinates correctly in Google Maps URL", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(desktopUA);
    const url = getDirectionsUrl(37.7749, -122.4194);
    expect(url).toContain("37.7749,-122.4194");
  });
});
