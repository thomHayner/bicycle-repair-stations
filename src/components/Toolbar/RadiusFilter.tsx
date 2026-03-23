const RADII = [0.5, 1, 2, 5] as const;
type Radius = (typeof RADII)[number];

const KM_TO_MI = 0.621371;

function formatRadius(km: Radius, unit: "km" | "mi"): string {
  if (unit === "mi") {
    const mi = km * KM_TO_MI;
    return `${mi < 1 ? mi.toFixed(1) : mi.toFixed(1)}mi`;
  }
  return km < 1 ? `${km * 1000}m` : `${km}km`;
}

interface Props {
  value: number;
  onChange: (km: Radius) => void;
  unit: "km" | "mi";
}

export function RadiusFilter({ value, onChange, unit }: Props) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Search radius">
      {RADII.map((km) => {
        const active = value === km;
        return (
          <button
            key={km}
            onClick={() => onChange(km)}
            aria-pressed={active}
            className={[
              "min-h-[44px] min-w-[44px] px-3 rounded-full text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
              active
                ? "bg-green-700 dark:bg-green-400 text-white dark:text-black shadow-sm"
                : "bg-white/80 text-gray-700 active:bg-gray-100",
            ].join(" ")}
          >
            {formatRadius(km, unit)}
          </button>
        );
      })}
    </div>
  );
}
