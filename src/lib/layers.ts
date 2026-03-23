export type LayerId = "default" | "satellite" | "terrain" | "pedestrian";

export const LAYERS: Array<{ id: LayerId; label: string; emoji: string }> = [
  { id: "default",    label: "Default",    emoji: "🗺️" },
  { id: "satellite",  label: "Satellite",  emoji: "🛰️" },
  { id: "terrain",    label: "Terrain",    emoji: "⛰️" },
  { id: "pedestrian", label: "Cycling",    emoji: "🚴" },
];
