import type { OverpassNode } from "../../types/overpass";
import { getDirectionsUrl } from "../../lib/directions";
import { KM_PER_MILE } from "../../lib/units";
import { useSettings } from "../../context/useSettings";

interface Props {
  station: OverpassNode;
  distMi: number | null;
}

export function StationPopup({ station, distMi }: Props) {
  const { unit } = useSettings();
  const { tags } = station;
  const name = tags.name ?? "Bicycle Repair Station";
  const hasTools = tags["service:bicycle:tools"] === "yes";
  const hasPump = tags["service:bicycle:pump"] === "yes";
  const hasRepair = tags["service:bicycle:repair"] === "yes";

  return (
    <div>
      <p className="font-bold text-[15px] text-slate-900 dark:text-slate-100 mb-2 leading-snug">
        {name}
      </p>

      {tags.description && (
        <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-2">
          {tags.description}
        </p>
      )}

      {tags.operator && (
        <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-1.5">
          <span className="font-semibold">Operator: </span>{tags.operator}
        </p>
      )}

      {(hasTools || hasPump || hasRepair) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {hasTools && (
            <span className="bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 text-[12px] px-2 py-0.5 rounded-full font-semibold">
              🔧 Tools
            </span>
          )}
          {hasPump && (
            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-[12px] px-2 py-0.5 rounded-full font-semibold">
              💨 Pump
            </span>
          )}
          {hasRepair && (
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[12px] px-2 py-0.5 rounded-full font-semibold">
              🛠 Repair
            </span>
          )}
        </div>
      )}

      {tags.opening_hours && (
        <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-1.5 flex items-start gap-1">
          <span>🕐</span>
          <span>{tags.opening_hours}</span>
        </p>
      )}

      {distMi != null && (() => {
        const distDisplay = unit === "km" ? distMi * KM_PER_MILE : distMi;
        return (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-2">
            {distDisplay < 0.1 ? "<0.1" : distDisplay.toFixed(1)} {unit} away
          </p>
        );
      })()}

      <a
        href={getDirectionsUrl(station.lat, station.lon)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 btn-get-directions bg-green-700 dark:bg-green-400 rounded-[10px] text-[13px] font-bold no-underline active:bg-green-800 dark:active:bg-green-300 transition-colors"
      >
        {/* Turn-by-turn arrow icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM13 16.17V13H9v-2h4V7.83l4.17 4.17L13 16.17z"/>
        </svg>
        Get Directions
      </a>
    </div>
  );
}
