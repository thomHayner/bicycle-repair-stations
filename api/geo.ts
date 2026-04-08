export const config = { runtime: "edge" };

export default function handler(req: Request) {
  const rawLat = parseFloat(req.headers.get("x-vercel-ip-latitude") ?? "");
  const rawLng = parseFloat(req.headers.get("x-vercel-ip-longitude") ?? "");
  return Response.json({
    lat: Number.isFinite(rawLat) ? rawLat : 40.015,
    lng: Number.isFinite(rawLng) ? rawLng : -105.2705,
    country: req.headers.get("x-vercel-ip-country") ?? "US",
    region: req.headers.get("x-vercel-ip-country-region") ?? "",
    city: req.headers.get("x-vercel-ip-city") ?? "",
  });
}
