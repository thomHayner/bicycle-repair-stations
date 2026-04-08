import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchStations } from "./overpass";

const PRIMARY = "https://overpass-api.de/api/interpreter";

// Minimal valid Overpass response
const okResponse = (elements: unknown[] = []) =>
  new Response(JSON.stringify({ version: 0.6, elements }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (status: number) =>
  new Response("error", { status });

const remarkResponse = (remark: string) =>
  new Response(JSON.stringify({ version: 0.6, elements: [], remark }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchStations", () => {
  it("returns stations on successful fetch", async () => {
    const station = { type: "node", id: 1, lat: 51.5, lon: -0.1, tags: {} };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(okResponse([station]));

    const result = await fetchStations(51.5, -0.1, 40, PRIMARY);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("retries on HTTP 429 and succeeds on fallback", async () => {
    const station = { type: "node", id: 2, lat: 51.5, lon: -0.1, tags: {} };
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(errorResponse(429))     // primary fails
      .mockResolvedValueOnce(okResponse([station]));  // first fallback succeeds

    const result = await fetchStations(51.5, -0.1, 40, PRIMARY);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on HTTP 502/503/504", async () => {
    const station = { type: "node", id: 3, lat: 51.5, lon: -0.1, tags: {} };
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(errorResponse(502))
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse([station]));

    const result = await fetchStations(51.5, -0.1, 40, PRIMARY);
    expect(result).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("retries on TypeError (network failure)", async () => {
    const station = { type: "node", id: 4, lat: 51.5, lon: -0.1, tags: {} };
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))  // offline
      .mockResolvedValueOnce(okResponse([station]));             // fallback succeeds

    const result = await fetchStations(51.5, -0.1, 40, PRIMARY);
    expect(result).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on server-side timeout (remark field)", async () => {
    const station = { type: "node", id: 5, lat: 51.5, lon: -0.1, tags: {} };
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(remarkResponse("runtime error: timeout"))  // server timeout
      .mockResolvedValueOnce(okResponse([station]));                     // fallback succeeds

    const result = await fetchStations(51.5, -0.1, 40, PRIMARY);
    expect(result).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws on non-retryable HTTP error without trying fallbacks", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(errorResponse(400));

    await expect(fetchStations(51.5, -0.1, 40, PRIMARY)).rejects.toThrow("HTTP 400");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry on AbortError", async () => {
    const abortErr = new DOMException("The operation was aborted.", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortErr);

    await expect(fetchStations(51.5, -0.1, 40, PRIMARY)).rejects.toThrow("aborted");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws after all 3 mirrors fail", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(errorResponse(429));

    await expect(fetchStations(51.5, -0.1, 40, PRIMARY)).rejects.toThrow("HTTP 429");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("detects server timeout with various remark messages", async () => {
    // "runtime error" variant
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(remarkResponse("runtime error: Query timed out in \"query\" at line 1"))
      .mockResolvedValueOnce(remarkResponse("Timeout occurred"))
      .mockResolvedValueOnce(remarkResponse("timeout reached"));

    await expect(fetchStations(51.5, -0.1, 40, PRIMARY)).rejects.toThrow("server timeout");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3); // tried all mirrors
  });
});
