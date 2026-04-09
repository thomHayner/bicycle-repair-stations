import { describe, it, expect } from "vitest";
import { haversineDistanceMiles, visibleWidthMiles } from "./distance";

describe("haversineDistanceMiles", () => {
  it("returns 0 for the same point", () => {
    expect(haversineDistanceMiles(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("returns ~24.2 miles between Denver and Boulder", () => {
    // Denver: 39.7392, -104.9903 / Boulder: 40.0150, -105.2705
    const dist = haversineDistanceMiles(39.7392, -104.9903, 40.0150, -105.2705);
    expect(dist).toBeGreaterThan(23.5);
    expect(dist).toBeLessThan(25.0);
  });

  it("returns ~3459 miles between London and New York", () => {
    // Great-circle distance London ↔ NYC ≈ 3459 statute miles
    const dist = haversineDistanceMiles(51.5074, -0.1278, 40.7128, -74.006);
    expect(dist).toBeGreaterThan(3440);
    expect(dist).toBeLessThan(3480);
  });

  it("handles negative coordinates correctly (southern hemisphere)", () => {
    // Sydney to Auckland — both south of equator
    const dist = haversineDistanceMiles(-33.8688, 151.2093, -36.8485, 174.7633);
    expect(dist).toBeGreaterThan(1330);
    expect(dist).toBeLessThan(1360);
  });

  it("is symmetric — distance(A,B) equals distance(B,A)", () => {
    const a = haversineDistanceMiles(48.8566, 2.3522, 52.52, 13.405);
    const b = haversineDistanceMiles(52.52, 13.405, 48.8566, 2.3522);
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("visibleWidthMiles", () => {
  it("returns 0 when west and east longitudes are equal", () => {
    expect(visibleWidthMiles(10, 10, 0)).toBe(0);
  });

  it("returns ~69.172 miles per degree at the equator (centerLat = 0)", () => {
    // cos(0°) = 1, so 1 degree of longitude = 69.172 miles
    const width = visibleWidthMiles(0, 1, 0);
    expect(width).toBeCloseTo(69.172, 1);
  });

  it("returns half the equatorial value at 60° latitude", () => {
    // cos(60°) = 0.5
    const width = visibleWidthMiles(0, 1, 60);
    expect(width).toBeCloseTo(69.172 * 0.5, 1);
  });

  it("handles a multi-degree span", () => {
    // 10° span at equator = 691.72 miles
    const width = visibleWidthMiles(-5, 5, 0);
    expect(width).toBeCloseTo(69.172 * 10, 0);
  });
});
