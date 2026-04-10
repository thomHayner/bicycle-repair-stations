import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useStationQuery } from "./useStationQuery";
import type { StationCache } from "../lib/stationCache";

// Mock i18n instance
vi.mock("../i18n", () => ({
  default: { t: (k: string) => k, language: "en", changeLanguage: vi.fn() },
}));

// Mock the cache module — we provide a realistic write-through implementation
vi.mock("../lib/stationCache", () => ({
  FETCH_RADIUS_KM: 40.2335,
  readCache: vi.fn(),
  writeCache: vi.fn(),
  isCovered: vi.fn(),
}));

// Mock the overpass fetch
vi.mock("../lib/overpass", () => ({
  fetchStations: vi.fn(),
}));

import { readCache, writeCache, isCovered } from "../lib/stationCache";
import { fetchStations } from "../lib/overpass";
import type { OverpassNode } from "../types/overpass";

const mockReadCache = readCache as ReturnType<typeof vi.fn>;
const mockWriteCache = writeCache as ReturnType<typeof vi.fn>;
const mockIsCovered = isCovered as ReturnType<typeof vi.fn>;
const mockFetchStations = fetchStations as ReturnType<typeof vi.fn>;

const station: OverpassNode = { type: "node", id: 1, lat: 51.5, lon: -0.1, tags: {} };

/**
 * Wire up readCache/writeCache/isCovered to behave like the real implementation:
 * writeCache stores data, readCache returns it, isCovered checks distance.
 * This is necessary because the hook's during-render staleness detection reads
 * the cache after a successful write to prevent an infinite loading loop.
 */
function setupRealisticCache(initial: StationCache | null = null) {
  let store: StationCache | null = initial;
  mockReadCache.mockImplementation(() => store);
  mockWriteCache.mockImplementation((data: StationCache) => { store = data; });
  mockIsCovered.mockImplementation((_lat: number, _lng: number, cache: StationCache | null) =>
    cache !== null && cache === store
  );
  return { getStore: () => store };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useStationQuery", () => {
  it("stays idle when lat and lng are null", () => {
    setupRealisticCache(null);
    const { result } = renderHook(() => useStationQuery(null, null));
    expect(result.current.status).toBe("idle");
    expect(mockFetchStations).not.toHaveBeenCalled();
  });

  it("serves from cache immediately when cache covers the coordinates", async () => {
    const cachedData: StationCache = {
      center: { lat: 51.5, lng: -0.1 },
      radiusKm: 40,
      stations: [station],
      fetchedAt: Date.now(),
    };
    setupRealisticCache(cachedData);
    // Override isCovered to always return true for this test
    mockIsCovered.mockReturnValue(true);

    const { result } = renderHook(() => useStationQuery(51.5, -0.1));
    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(mockFetchStations).not.toHaveBeenCalled();
    const successState = result.current as Extract<typeof result.current, { status: "success" }>;
    expect(successState.stations).toEqual([station]);
  });

  it("fetches when cache misses and transitions to success", async () => {
    // Use realistic cache: writeCache updates readCache so during-render loop terminates
    setupRealisticCache(null);
    mockFetchStations.mockResolvedValue([station]);

    const { result } = renderHook(() => useStationQuery(51.5, -0.1));
    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(mockFetchStations).toHaveBeenCalledOnce();
    expect(mockWriteCache).toHaveBeenCalledOnce();
    const successState = result.current as Extract<typeof result.current, { status: "success" }>;
    expect(successState.stations).toHaveLength(1);
  });

  it("calls writeCache with the fetched stations on success", async () => {
    setupRealisticCache(null);
    mockFetchStations.mockResolvedValue([station]);

    renderHook(() => useStationQuery(51.5, -0.1));
    await waitFor(() => expect(mockWriteCache).toHaveBeenCalledOnce());

    const [writeArg] = mockWriteCache.mock.calls[0] as [StationCache];
    expect(writeArg.stations).toEqual([station]);
    expect(writeArg.center).toEqual({ lat: 51.5, lng: -0.1 });
  });

  it("does not call writeCache when fetch returns empty array", async () => {
    setupRealisticCache(null);
    mockFetchStations.mockResolvedValue([]);

    renderHook(() => useStationQuery(51.5, -0.1));
    // Wait for the fetch to complete
    await waitFor(() => expect(mockFetchStations).toHaveBeenCalledOnce());
    // Give time for async state updates
    await new Promise((r) => setTimeout(r, 50));

    expect(mockWriteCache).not.toHaveBeenCalled();
  });

  it("transitions to 'error' when fetch fails after prevCoords is established", async () => {
    // Step 1: successful fetch at coords A to set prevCoords (prevents during-render
    // staleness logic from resetting error→loading when prevCoords is null).
    const initialCache: StationCache = {
      center: { lat: 51.0, lng: -0.1 },
      radiusKm: 200,
      stations: [station],
      fetchedAt: Date.now(),
    };
    mockReadCache.mockReturnValue(initialCache);
    mockIsCovered.mockReturnValue(true);

    const { result, rerender } = renderHook(
      (props: { lat: number; lng: number }) => useStationQuery(props.lat, props.lng),
      { initialProps: { lat: 51.0, lng: -0.1 } }
    );
    await waitFor(() => expect(result.current.status).toBe("success"));

    // Step 2: move to new coords where cache doesn't cover, and fetch fails
    mockIsCovered.mockReturnValue(false);
    mockFetchStations.mockRejectedValue(new Error("HTTP 429"));
    rerender({ lat: 40.7, lng: -74.0 });

    await waitFor(() => expect(result.current.status).toBe("error"), { timeout: 2000 });
    const errState = result.current as Extract<typeof result.current, { status: "error" }>;
    expect(errState.message).toBeTruthy();
  });

  it("does not transition to error on AbortError", async () => {
    setupRealisticCache(null);
    const abortErr = new DOMException("aborted", "AbortError");
    mockFetchStations.mockRejectedValue(abortErr);

    const { result } = renderHook(() => useStationQuery(51.5, -0.1));
    // Wait for fetch to be called
    await waitFor(() => expect(mockFetchStations).toHaveBeenCalled());
    // Give extra time for any state transitions to settle
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.status).not.toBe("error");
  });

  it("re-fetches when retry() is called with an invalidated cache", async () => {
    setupRealisticCache(null);
    mockFetchStations.mockResolvedValue([station]);

    const { result } = renderHook(() => useStationQuery(51.5, -0.1));
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(mockFetchStations).toHaveBeenCalledTimes(1);

    // Invalidate the cache so the retry actually fetches (not a cache hit)
    mockReadCache.mockReturnValue(null);
    mockIsCovered.mockReturnValue(false);

    act(() => { result.current.retry(); });
    await waitFor(() => expect(mockFetchStations).toHaveBeenCalledTimes(2));
  });

  it("exposes a retry function", () => {
    setupRealisticCache(null);
    const { result } = renderHook(() => useStationQuery(null, null));
    expect(typeof result.current.retry).toBe("function");
  });
});
