import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readCache, writeCache, isCovered, FETCH_RADIUS_KM, type StationCache } from "./stationCache";

const CACHE_TTL_MS = 86_400_000; // 24 hours — matches the internal constant

const makeCache = (overrides: Partial<StationCache> = {}): StationCache => ({
  center: { lat: 51.5, lng: -0.1 },
  radiusKm: FETCH_RADIUS_KM,
  stations: [],
  fetchedAt: Date.now(),
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("readCache", () => {
  it("returns null when localStorage is empty", () => {
    expect(readCache()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    localStorage.setItem("brs_v3", "not-valid-json{{{");
    expect(readCache()).toBeNull();
  });

  it("returns null when cache is older than 24 hours", () => {
    const old = makeCache({ fetchedAt: Date.now() - CACHE_TTL_MS - 1 });
    localStorage.setItem("brs_v3", JSON.stringify(old));
    expect(readCache()).toBeNull();
  });

  it("returns the cache when it is exactly 1 ms under the 24-hour TTL", () => {
    const fresh = makeCache({ fetchedAt: Date.now() - CACHE_TTL_MS + 1 });
    localStorage.setItem("brs_v3", JSON.stringify(fresh));
    expect(readCache()).not.toBeNull();
  });
});

describe("writeCache + readCache round-trip", () => {
  it("preserves all fields through a write/read cycle", () => {
    const station = { type: "node" as const, id: 42, lat: 51.5, lon: -0.1, tags: {} };
    const original = makeCache({ stations: [station] });
    writeCache(original);

    const cached = readCache();
    expect(cached).not.toBeNull();
    expect(cached!.center).toEqual({ lat: 51.5, lng: -0.1 });
    expect(cached!.radiusKm).toBe(FETCH_RADIUS_KM);
    expect(cached!.stations).toHaveLength(1);
    expect(cached!.stations[0].id).toBe(42);
  });
});

describe("writeCache", () => {
  it("silently ignores localStorage.setItem exceptions", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeCache(makeCache())).not.toThrow();
  });
});

describe("isCovered", () => {
  it("returns true when the query point is the same as the cache center", () => {
    const cache = makeCache({ center: { lat: 51.5, lng: -0.1 }, radiusKm: FETCH_RADIUS_KM });
    expect(isCovered(51.5, -0.1, cache, FETCH_RADIUS_KM)).toBe(true);
  });

  it("returns false when the query point is outside the cached circle", () => {
    // Cache covers 25 miles (≈40 km) from central London
    // Query from Edinburgh (~330 miles away) — not covered
    const cache = makeCache({ center: { lat: 51.5, lng: -0.1 }, radiusKm: FETCH_RADIUS_KM });
    expect(isCovered(55.9533, -3.1883, cache, FETCH_RADIUS_KM)).toBe(false);
  });

  it("returns false when a slight shift pushes neededRadius outside cached radius", () => {
    // Shift ~5 km away from center; neededRadius equals cache radius → 5+40 > 40
    const cache = makeCache({ center: { lat: 51.5, lng: -0.1 }, radiusKm: FETCH_RADIUS_KM });
    // ~5 km north of center
    expect(isCovered(51.545, -0.1, cache, FETCH_RADIUS_KM)).toBe(false);
  });

  it("returns true when a large cached radius covers a smaller needed radius at a shifted center", () => {
    // Cache: 200 km radius, center at 51.5,-0.1
    // Query: 100 km away, neededRadius 40 km → 100 + 40 = 140 ≤ 200 → covered
    const cache = makeCache({ center: { lat: 51.5, lng: -0.1 }, radiusKm: 200 });
    // ~100 km north: ~0.9° latitude ≈ 62 miles ≈ 100 km
    expect(isCovered(52.4, -0.1, cache, FETCH_RADIUS_KM)).toBe(true);
  });

  it("uses FETCH_RADIUS_KM as the default neededRadius", () => {
    const cache = makeCache({ center: { lat: 51.5, lng: -0.1 }, radiusKm: FETCH_RADIUS_KM });
    // Same as cache center with default neededRadius → always covered
    const withDefault = isCovered(51.5, -0.1, cache);
    const withExplicit = isCovered(51.5, -0.1, cache, FETCH_RADIUS_KM);
    expect(withDefault).toBe(withExplicit);
  });
});
