import { describe, it, expect } from "vitest";
import handler from "./geo";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/geo", { headers });
}

describe("GET /api/geo", () => {
  it("returns lat/lng/country from Vercel IP headers", async () => {
    const req = makeRequest({
      "x-vercel-ip-latitude": "51.5074",
      "x-vercel-ip-longitude": "-0.1278",
      "x-vercel-ip-country": "GB",
    });
    const res = await handler(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.lat).toBe(51.5074);
    expect(data.lng).toBe(-0.1278);
    expect(data.country).toBe("GB");
  });

  it("falls back to Denver coords when lat/lng headers are missing", async () => {
    const req = makeRequest({});
    const res = await handler(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.lat).toBe(40.015);
    expect(data.lng).toBe(-105.2705);
  });

  it("falls back to Denver coords when lat/lng headers are non-numeric", async () => {
    const req = makeRequest({
      "x-vercel-ip-latitude": "not-a-number",
      "x-vercel-ip-longitude": "also-not-a-number",
    });
    const res = await handler(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.lat).toBe(40.015);
    expect(data.lng).toBe(-105.2705);
  });

  it("defaults country to 'US' when country header is missing", async () => {
    const req = makeRequest({
      "x-vercel-ip-latitude": "48.8566",
      "x-vercel-ip-longitude": "2.3522",
    });
    const res = await handler(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.country).toBe("US");
  });

  it("returns a JSON Content-Type response", async () => {
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("includes region and city fields in the response", async () => {
    const req = makeRequest({
      "x-vercel-ip-country": "JP",
      "x-vercel-ip-country-region": "13",
      "x-vercel-ip-city": "Tokyo",
    });
    const res = await handler(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.region).toBe("13");
    expect(data.city).toBe("Tokyo");
  });
});
