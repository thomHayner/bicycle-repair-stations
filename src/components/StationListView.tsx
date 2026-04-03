import { useState } from "react";
import type { OverpassNode } from "../types/overpass";
import { haversineDistanceMiles } from "../lib/distance";
import { getDirectionsUrl } from "../lib/directions";
import { type Unit, KM_PER_MILE, MI_OPTIONS, KM_OPTIONS } from "../lib/units";

const AMENITY_FILTERS = [
  { key: "pump",   label: "💨 Pump",   tag: "service:bicycle:pump",   active: "bg-sky-700 dark:bg-sky-400 border-sky-700 dark:border-sky-400 text-white dark:text-black",    inactive: "bg-white dark:bg-[#0d1220] border-slate-200 dark:border-[#1e2a3a] text-slate-600 dark:text-slate-300" },
  { key: "tools",  label: "🔧 Tools",  tag: "service:bicycle:tools",  active: "bg-green-700 dark:bg-green-400 border-green-700 dark:border-green-400 text-white dark:text-black",  inactive: "bg-white dark:bg-[#0d1220] border-slate-200 dark:border-[#1e2a3a] text-slate-600 dark:text-slate-300" },
  { key: "repair", label: "🛠 Repair", tag: "service:bicycle:repair", active: "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400 text-white dark:text-black",  inactive: "bg-white dark:bg-[#0d1220] border-slate-200 dark:border-[#1e2a3a] text-slate-600 dark:text-slate-300" },
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
  onStationSelect: (station: OverpassNode) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** True while the Overpass query is in-flight. */
  isFetchingStations?: boolean;
}

export function StationListView({
  stations,
  filterCenter,
  userDistances,
  unit,
  onUnitChange,
  selectedDist,
  onDistChange,
  onStationSelect,
  expanded,
  onExpandedChange,
  isFetchingStations = false,
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
  const sorted = filterCenter
    ? [...stations].sort(
        (a, b) =>
          haversineDistanceMiles(filterCenter.lat, filterCenter.lng, a.lat, a.lon) -
          haversineDistanceMiles(filterCenter.lat, filterCenter.lng, b.lat, b.lon)
      )
    : stations;

  // Apply amenity filters (AND logic — must have all selected)
  const filtered = activeFilters.size === 0
    ? sorted
    : sorted.filter((s) =>
        [...activeFilters].every(
          (key) => s.tags[AMENITY_FILTERS.find((f) => f.key === key)!.tag] === "yes"
        )
      );

  const total = stations.length;
  const shown = filtered.length;
  const hasActiveFilters = activeFilters.size > 0;
  const options = unit === "mi" ? MI_OPTIONS : KM_OPTIONS;

  const headerLabel =
    total === 0
      ? "No stations found"
      : hasActiveFilters
      ? `${shown} of ${total} station${total !== 1 ? "s" : ""} within ${selectedDist} ${unit}`
      : `${total} station${total !== 1 ? "s" : ""} within ${selectedDist} ${unit}`;

  return (
    <div className="fixed bottom-[65px] left-3 right-3 z-[900] rounded-2xl shadow-lg bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm overflow-hidden">

      {/* Handle — always visible */}
      <button
        onClick={() => onExpandedChange(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse station list" : "Expand station list"}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {/* this is the spinning circle */}
          {/* {isFetchingStations && (
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-green-600 border-t-transparent animate-spin shrink-0"
              aria-hidden="true"
            />
          )} */}
          {/* this is the pulsing text */}
          <span className={isFetchingStations ? "animate-pulse" : undefined}>
            {isFetchingStations && total === 0 ? "Searching nearby\u2026" : headerLabel}
          </span>
        </span>
        {/* not sure what this is, it says its a rotate-180, maybe the grow/shrink? */}
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
        className={`overflow-y-auto transition-[max-height] duration-300 ease-in-out ${
          expanded ? "max-h-[50vh]" : "max-h-0"
        }`}
      >
        {/* Distance row */}
        <div className="border-t border-slate-100 dark:border-[#1e2a3a] px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex rounded-full border border-slate-200 dark:border-[#1e2a3a] overflow-hidden shrink-0 mr-1">
            {(["mi", "km"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUnitChange(u)}
                className={[
                  "text-xs font-semibold px-3 py-1 transition-colors",
                  u === unit
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-[#0d1220] text-slate-500 dark:text-slate-400 active:bg-slate-50 dark:active:bg-slate-800/50",
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
                "text-xs font-semibold px-3 py-1 rounded-full border transition-colors",
                d === selectedDist
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white dark:bg-[#0d1220] border-slate-200 dark:border-[#1e2a3a] text-slate-600 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-800/50",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Amenity filter row */}
        <div className="border-t border-slate-100 dark:border-[#1e2a3a] px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Filter:</span>
          {AMENITY_FILTERS.map((f) => {
            const on = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                className={[
                  "text-xs font-semibold px-3 py-1 rounded-full border transition-colors",
                  on ? f.active : f.inactive + " active:bg-slate-50 dark:active:bg-slate-800/50",
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
              className="text-xs text-slate-500 dark:text-slate-400 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Station list */}
        <div className="border-t border-slate-100 dark:border-[#1e2a3a]">
          {filtered.length === 0 && !isFetchingStations && (
            <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 text-center">
              {total === 0
                ? "No stations in this area"
                : "No stations match the selected filters"}
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
                className={`w-full flex items-start justify-between px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800/30 transition-colors ${
                  i > 0 ? "border-t border-slate-100 dark:border-[#1e2a3a]" : ""
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
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 active:bg-green-100 dark:active:bg-green-900/50 transition-colors"
                    aria-label={`Get directions to ${name}`}
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
}
