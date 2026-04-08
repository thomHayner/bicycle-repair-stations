export const config = { runtime: "edge" };

export default function handler(req: Request) {
  return Response.json({
    lat: Number(req.headers.get("x-vercel-ip-latitude") ?? 40.015),
    lng: Number(req.headers.get("x-vercel-ip-longitude") ?? -105.2705),
    country: req.headers.get("x-vercel-ip-country") ?? "US",
    region: req.headers.get("x-vercel-ip-country-region") ?? "",
    city: req.headers.get("x-vercel-ip-city") ?? "",
  });
}
