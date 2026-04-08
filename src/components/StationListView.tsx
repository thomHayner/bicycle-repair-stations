import { memo, useMemo, useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "../lib/distance";
import { getDirectionsUrl } from "../lib/directions";
import { type Unit, KM_PER_MILE } from "../lib/units";

export type QueryStatus = "idle" | "loading" | "success" | "none" | "error";

interface HeaderState {
  text: string;
  pulse: boolean;
  emptyPanelText: string | null;
}

/** Single source of truth for all header / empty-state display text. */
function getHeaderState(
  queryStatus: QueryStatus,
  total: number,
  shown: number,
  hasActiveFilters: boolean,
  selectedDist: number,
  unit: string,
  isWideSearch: boolean,
): HeaderState {
  // Searching — query idle or in-flight with no prior results
  if ((queryStatus === "idle" || queryStatus === "loading") && total === 0)
    return { text: isWideSearch ? "Searching wider area\u2026" : "Searching nearby\u2026", pulse: true, emptyPanelText: null };

  // Refreshing — re-fetching but we still have previous results on screen
  if (queryStatus === "loading" && total > 0)
    return { text: isWideSearch ? "Searching wider area\u2026" : `${total} station${total !== 1 ? "s" : ""} within ${selectedDist} ${unit}`, pulse: true, emptyPanelText: null };

  // Query finished with zero results
  if (total === 0)
    return { text: "No stations found", pulse: false, emptyPanelText: "No stations in this area." };

  // Has stations, amenity filters active
  if (hasActiveFilters)
    return {
      text: `${shown} of ${total} station${total !== 1 ? "s" : ""} within ${selectedDist} ${unit}`,
      pulse: false,
      emptyPanelText: shown === 0 ? "No stations match the selected filters." : null,
    };

  // Has stations, no filters
  return { text: `${total} station${total !== 1 ? "s" : ""} within ${selectedDist} ${unit}`, pulse: false, emptyPanelText: null };
}

const AMENITY_FILTERS = [
  { key: "pump",   label: "💨 Pump",   tag: "service:bicycle:pump",   active: "bg-[var(--color-secondary)] border-[var(--color-secondary)] text-[var(--color-on-secondary)]",    inactive: "bg-[var(--color-surface-container)] border-[var(--color-border)] text-slate-600 dark:text-slate-300" },
  { key: "tools",  label: "🔧 Tools",  tag: "service:bicycle:tools",  active: "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-on-primary)]",  inactive: "bg-[var(--color-surface-container)] border-[var(--color-border)] text-slate-600 dark:text-slate-300" },
  { key: "repair", label: "🛠 Repair", tag: "service:bicycle:repair", active: "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400 text-white dark:text-black",  inactive: "bg-[var(--color-surface-container)] border-[var(--color-border)] text-slate-600 dark:text-slate-300" },
] as const;

type FilterKey = (typeof AMENITY_FILTERS)[number]["key"];

interface Props {
  stations: OverpassNode[];
  filterCenter: { lat: number; lng: number } | null;
  userDistances: Map<number, number> | null;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  selectedDist: number;
  onDistChange: (dist: number) => void;
  distOptions: readonly number[];
  isWideSearch: boolean;
  onStationSelect: (station: OverpassNode) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Current query lifecycle status — drives header text deterministically. */
  queryStatus: QueryStatus;
}

export const StationListView = memo(function StationListView({
  stations,
  filterCenter,
  userDistances,
  unit,
  onUnitChange,
  selectedDist,
  onDistChange,
  distOptions,
  isWideSearch,
  onStationSelect,
  expanded,
  onExpandedChange,
  queryStatus,
}: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  // Sort by distance
  const sorted = useMemo(
    () => filterCenter
      ? [...stations].sort(
          (a, b) =>
            haversineDistanceMiles(filterCenter.lat, filterCenter.lng, a.lat, a.lon) -
            haversineDistanceMiles(filterCenter.lat, filterCenter.lng, b.lat, b.lon)
        )
      : stations,
    [stations, filterCenter],
  );

  // Apply amenity filters (AND logic — must have all selected)
  const filtered = useMemo(
    () => activeFilters.size === 0
      ? sorted
      : sorted.filter((s) =>
          [...activeFilters].every(
            (key) => s.tags[AMENITY_FILTERS.find((f) => f.key === key)!.tag] === "yes"
          )
        ),
    [sorted, activeFilters],
  );

  const total = stations.length;
  const shown = filtered.length;
  const hasActiveFilters = activeFilters.size > 0;
  const options = distOptions;

  const { text: headerText, pulse: headerPulse, emptyPanelText } = getHeaderState(
    queryStatus, total, shown, hasActiveFilters, selectedDist, unit, isWideSearch,
  );
  const headerKey = headerPulse ? "loading" : headerText;

  return (
    <div
      className="fixed left-3 right-3 z-[900] rounded-2xl elevation-2 bg-[var(--color-surface-glass)] backdrop-blur-sm overflow-hidden"
      style={{ bottom: "var(--layout-sheet-bottom)" }}
    >

      {/* Handle — always visible */}
      <button
        onClick={() => onExpandedChange(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 state-surface transition-colors focus-ring-inset"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse station list" : "Expand station list"}
      >
        <span className="flex items-center gap-1.5 type-title-small text-slate-800 dark:text-slate-100">
          <span key={headerKey} className={headerPulse ? "animate-pulse" : undefined}>
            {headerText}
          </span>
        </span>
                <svg
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Expanded panel */}
      <div
        className={`transition-[max-height] duration-300 ease-in-out ${
          expanded ? "max-h-[50vh] overflow-y-auto" : "max-h-0 overflow-hidden"
        }`}
      >
        {/* Distance row */}
        <div className="border-t border-[var(--color-border)] px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex rounded-full border border-[var(--color-border)] overflow-hidden shrink-0 mr-1">
            {(["mi", "km"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUnitChange(u)}
                className={[
                  "type-label-small px-3 py-1 transition-colors focus-ring-inset",
                  u === unit
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "bg-[var(--color-surface-container)] text-slate-500 dark:text-slate-400 state-surface",
                ].join(" ")}
              >
                {u}
              </button>
            ))}
          </div>
          {options.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDistChange(d)}
              className={[
                "type-label-small px-3 py-1 rounded-full border transition-colors focus-ring",
                d === selectedDist
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "bg-[var(--color-surface-container)] border-[var(--color-border)] text-slate-600 dark:text-slate-300 state-surface",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Amenity filter row */}
        <div className="border-t border-[var(--color-border)] px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Filter:</span>
          {AMENITY_FILTERS.map((f) => {
            const on = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                className={[
                  "type-label-small px-3 py-1 rounded-full border transition-colors focus-ring",
                  on ? f.active : f.inactive + " state-surface",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setActiveFilters(new Set())}
              className="text-xs text-slate-500 dark:text-slate-400 underline ml-1 hover:text-slate-700 dark:hover:text-slate-200 focus-ring rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Station list */}
        <div className="border-t border-[var(--color-border)]">
          {emptyPanelText && (
            <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 text-center">
              {emptyPanelText}
            </div>
          )}

          {filtered.map((station, i) => {
            const distMi = userDistances?.get(station.id) ?? null;
            const distDisplay = distMi == null ? null : unit === "km" ? distMi * KM_PER_MILE : distMi;

            const name = station.tags.name ?? "Bicycle Repair Station";
            const hasPump  = station.tags["service:bicycle:pump"]   === "yes";
            const hasTools = station.tags["service:bicycle:tools"]  === "yes";
            const hasRepair= station.tags["service:bicycle:repair"] === "yes";

            return (
              <button
                key={station.id}
                onClick={() => onStationSelect(station)}
                className={`w-full flex items-start justify-between px-4 py-3 text-left state-surface transition-colors focus-ring-inset ${
                  i > 0 ? "border-t border-[var(--color-border)]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{name}</p>
                  {(hasPump || hasTools || hasRepair) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasPump  && <span className="text-xs bg-sky-50   dark:bg-sky-950/50 text-sky-700  dark:text-sky-400  rounded-full px-2 py-0.5">💨 Pump</span>}
                      {hasTools && <span className="text-xs bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">🔧 Tools</span>}
                      {hasRepair&& <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5">🛠 Repair</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {distDisplay != null && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {distDisplay < 0.1 ? "<0.1" : distDisplay.toFixed(1)} {unit}
                    </span>
                  )}
                  <a
                    href={getDirectionsUrl(station.lat, station.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 active:bg-green-200 dark:active:bg-green-900/70 transition-colors focus-ring"
                    aria-label={`Get directions to ${name}`}
                    title={`Get directions to ${name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM13 16.17V13H9v-2h4V7.83l4.17 4.17L13 16.17z"/>
                    </svg>
                  </a>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
