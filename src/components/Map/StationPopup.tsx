import { useTranslation } from "react-i18next";
import type { OverpassNode } from "../../types/overpass";
import { getDirectionsUrl } from "../../lib/directions";
import { KM_PER_MILE } from "../../lib/units";
import { useSettings } from "../../context/useSettings";
import { formatDistance } from "../../lib/formatNumber";
import { trackEvent } from "../../lib/analytics";

interface Props {
  station: OverpassNode;
  distMi: number | null;
}

export function StationPopup({ station, distMi }: Props) {
  const { t, i18n } = useTranslation("map");
  const { unit } = useSettings();
  const { tags } = station;
  const name = tags.name ?? t("defaultStationName");
  const hasTools = tags["service:bicycle:tools"] === "yes";
  const hasPump = tags["service:bicycle:pump"] === "yes";
  const hasRepair = tags["service:bicycle:repair"] === "yes";

  return (
    <div>
      <p className="font-bold text-[15px] text-[var(--color-text-primary)] mb-2 leading-snug">
        {name}
      </p>

      {tags.description && (
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-2">
          {tags.description}
        </p>
      )}

      {tags.operator && (
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-1.5">
          <span className="font-semibold">{t("operator")} </span>{tags.operator}
        </p>
      )}

      {(hasTools || hasPump || hasRepair) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {hasTools && (
            <span className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-[12px] px-2 py-0.5 rounded-full font-semibold">
              {t("tools")}
            </span>
          )}
          {hasPump && (
            <span className="bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-[12px] px-2 py-0.5 rounded-full font-semibold">
              {t("pump")}
            </span>
          )}
          {hasRepair && (
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[12px] px-2 py-0.5 rounded-full font-semibold">
              {t("repair")}
            </span>
          )}
        </div>
      )}

      {tags.opening_hours && (
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-1.5 flex items-start gap-1">
          <span>🕐</span>
          <span>{tags.opening_hours}</span>
        </p>
      )}

      {distMi != null && (() => {
        const distDisplay = unit === "km" ? distMi * KM_PER_MILE : distMi;
        return (
          <p className="text-[12px] text-[var(--color-text-muted)] mb-2">
            {t("distanceAway", { distance: formatDistance(distDisplay, i18n.language), unit })}
          </p>
        );
      })()}

      <a
        href={getDirectionsUrl(station.lat, station.lon)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent("popup_directions_click", { station_id: String(station.id) })
        }
        className="flex items-center justify-center gap-1.5 w-full py-2 btn-get-directions bg-[var(--color-primary)] rounded-[10px] text-[13px] font-bold no-underline hover:brightness-95 active:brightness-90 focus-ring transition-colors"
      >
        {/* Turn-by-turn arrow icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM13 16.17V13H9v-2h4V7.83l4.17 4.17L13 16.17z"/>
        </svg>
        {t("getDirections")}
      </a>
    </div>
  );
}
