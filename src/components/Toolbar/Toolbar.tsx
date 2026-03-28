import { useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { LAYERS, type LayerId } from "../../lib/layers";
import { MenuDrawer } from "../Menu/MenuDrawer";
import type { Unit } from "../../lib/units";

interface Props {
  onLocationFound: (pos: { lat: number; lng: number }, zoom?: number) => void;
  onRecenter: () => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
  userPosition: { lat: number; lng: number } | null;
  locationDenied: boolean;
  activeLayer: LayerId;
  onLayerChange: (layer: LayerId) => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results[0]) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

export function Toolbar({ onLocationFound, onRecenter, mapRef, userPosition, locationDenied, activeLayer, onLayerChange, unit, onUnitChange }: Props) {
  const [query, setQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationNotFound, setLocationNotFound] = useState(false);
  const [layerPickerOpen, setLayerPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRecenter = () => {
    if (!userPosition) return;
    onRecenter();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (isGeocoding) return;
    if (!q) {
      const center = mapRef.current?.getCenter();
      if (center) onLocationFound({ lat: center.lat, lng: center.lng }, 16);
      return;
    }
    setLocationNotFound(false);
    setIsGeocoding(true);
    try {
      const pos = await geocode(q);
      if (pos) {
        onLocationFound(pos);
        inputRef.current?.blur();
      } else {
        setLocationNotFound(true);
      }
    } catch {
      setLocationNotFound(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const bannerHeight = locationNotFound || locationDenied ? 32 : 0;
  const fabTop = 12 + 56 + bannerHeight + 8;

  return (
    <>
      <header
        className="fixed top-3 left-3 right-3 z-[1000] bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden"
        style={{ height: locationDenied || locationNotFound ? "auto" : 56 }}
      >
        <div className="flex items-center px-3 gap-2" style={{ height: 56 }}>
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight hidden sm:block">
              BicycleRepairStations.com
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight sm:hidden">
              BRS
            </span>
          </div>

          {/* Search form — static magnifying glass */}
          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <div className={[
              "flex items-center w-full rounded-full border transition-colors",
              locationNotFound
                ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800"
                : "border-sky-200 bg-sky-50 dark:border-[#1e3a5f] dark:bg-[#0d1830] focus-within:border-green-400 focus-within:bg-white dark:focus-within:border-sky-600 dark:focus-within:bg-[#0d1830]",
            ].join(" ")}>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setLocationNotFound(false); }}
                placeholder="Search location…"
                aria-label="Search location"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2 min-h-[44px] outline-none min-w-0"
              />

              {/* Spinner while geocoding */}
              {isGeocoding ? (
                <span className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
                  <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin inline-block" />
                </span>
              ) : (
                <button
                  type="submit"
                  aria-label="Search"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 dark:text-green-500 active:text-green-800 transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {locationNotFound && (
          <div className="bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900 px-4 py-1.5 text-xs text-red-700 dark:text-red-400 text-center">
            Location not found — try a different search term.
          </div>
        )}

        {locationDenied && !locationNotFound && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-400 text-center">
            Location access denied — search above or enable location to find stations near you.
          </div>
        )}
      </header>

      {/* Locate me FAB — top-right, below the toolbar card */}
      <button
        type="button"
        onClick={handleRecenter}
        disabled={!userPosition}
        aria-label="Use my location"
        style={{ top: fabTop }}
        className={[
          "fixed right-3 z-[1000] w-11 h-11 rounded-full",
          "bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg",
          "flex items-center justify-center transition-colors",
          userPosition
            ? "text-green-600 dark:text-green-500 active:bg-sky-50 dark:active:bg-sky-950/30"
            : "text-slate-300 dark:text-slate-500 cursor-default",
        ].join(" ")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <circle cx="12" cy="12" r="8"/>
        </svg>
      </button>

      {/* Layer picker FAB — below the locate FAB */}
      <button
        type="button"
        onClick={() => setLayerPickerOpen((p) => !p)}
        aria-label="Select map layer"
        style={{ top: fabTop + 44 + 8 }}
        className={[
          "fixed right-3 z-[1000] w-11 h-11 rounded-full",
          "bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg",
          "flex items-center justify-center transition-colors",
          layerPickerOpen
            ? "text-green-600 dark:text-green-500 bg-sky-50/80 dark:bg-sky-950/30"
            : "text-slate-600 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-800/50",
        ].join(" ")}
      >
        {/* Layers / stack icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </button>

      {/* Backdrop — closes picker on outside tap */}
      {layerPickerOpen && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => setLayerPickerOpen(false)}
        />
      )}

      {/* Layer picker panel */}
      {layerPickerOpen && (
        <div
          style={{ top: fabTop + 44 + 8 }}
          className="fixed right-[60px] z-[1000] bg-white/95 dark:bg-[#0d1220]/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden min-w-[152px]"
        >
          {LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => { onLayerChange(l.id); setLayerPickerOpen(false); }}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                activeLayer === l.id
                  ? "bg-sky-50 dark:bg-sky-950/40 text-green-700 dark:text-green-400 font-semibold"
                  : "text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50",
              ].join(" ")}
            >
              <span className="text-base leading-none">{l.emoji}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} unit={unit} onUnitChange={onUnitChange} />
    </>
  );
}
