import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGeolocation } from "./useGeolocation";

// Mock the i18n module (not used by this hook, but transitive deps may import it)
vi.mock("../i18n", () => ({
  default: { t: (k: string) => k, language: "en", changeLanguage: vi.fn() },
}));

const makePosition = (lat: number, lng: number, accuracy = 10) =>
  ({ coords: { latitude: lat, longitude: lng, accuracy } } as GeolocationPosition);

let mockWatchPosition: ReturnType<typeof vi.fn>;
let mockClearWatch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockWatchPosition = vi.fn();
  mockClearWatch = vi.fn();
  vi.restoreAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useGeolocation", () => {
  it("requests geolocation via watchPosition on mount", async () => {
    // renderHook flushes effects synchronously via act(), so "idle" is immediately
    // superseded by "loading". Verify the effect ran by checking watchPosition was called.
    mockWatchPosition.mockImplementation(() => 99);
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    renderHook(() => useGeolocation());
    await waitFor(() => expect(mockWatchPosition).toHaveBeenCalledOnce());
  });

  it("transitions to loading after mount when geolocation is available", async () => {
    // watchPosition never calls back — status stays loading
    mockWatchPosition.mockImplementation(() => 99);
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("loading"));
  });

  it("transitions to resolved when watchPosition succeeds", async () => {
    mockWatchPosition.mockImplementation((success: PositionCallback) => {
      success(makePosition(51.5, -0.1, 15));
      return 1;
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("resolved"));

    const state = result.current as Extract<typeof result.current, { status: "resolved" }>;
    expect(state.lat).toBe(51.5);
    expect(state.lng).toBe(-0.1);
    expect(state.accuracy).toBe(15);
  });

  it("falls back to IP geo when watchPosition errors", async () => {
    mockWatchPosition.mockImplementation((_: unknown, error: PositionErrorCallback) => {
      error({ code: 1, message: "denied" } as GeolocationPositionError);
      return 1;
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ lat: 48.8566, lng: 2.3522, country: "FR" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("denied"));

    const state = result.current as Extract<typeof result.current, { status: "denied" }>;
    expect(state.lat).toBe(48.8566);
    expect(state.lng).toBe(2.3522);
    expect(state.country).toBe("FR");
  });

  it("uses ENV fallback coords when both geolocation and IP geo fail", async () => {
    mockWatchPosition.mockImplementation((_: unknown, error: PositionErrorCallback) => {
      error({ code: 1, message: "denied" } as GeolocationPositionError);
      return 1;
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("denied"));

    const state = result.current as Extract<typeof result.current, { status: "denied" }>;
    // Denver fallback from ENV
    expect(state.lat).toBe(40.015);
    expect(state.lng).toBe(-105.2705);
  });

  it("calls IP geo fallback immediately when geolocation API is unavailable", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: undefined,
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ lat: 35.6895, lng: 139.6917, country: "JP" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/geo");
  });

  it("calls clearWatch on unmount", async () => {
    mockWatchPosition.mockImplementation(() => 42);
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    });

    const { unmount } = renderHook(() => useGeolocation());
    await waitFor(() => expect(mockWatchPosition).toHaveBeenCalled());
    unmount();
    expect(mockClearWatch).toHaveBeenCalledWith(42);
  });
});
