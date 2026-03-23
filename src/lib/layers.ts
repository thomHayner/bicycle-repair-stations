export type LayerId = "cycling" | "satellite" | "standard";

export const LAYERS: Array<{ id: LayerId; label: string; emoji: string }> = [
  { id: "cycling",   label: "Cycling",   emoji: "🚴" },
  { id: "satellite", label: "Satellite", emoji: "🛰️" },
  { id: "standard",  label: "Standard",  emoji: "🗺️" },
];
