import { useNavigate } from "react-router-dom";
import { useSettings, type Theme } from "../../context/SettingsContext";
import type { Unit } from "../../lib/units";

interface Props {
  open: boolean;
  onClose: () => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

const NAV_ITEMS = [
  { label: "Find Stations",   emoji: "🗺️", path: "/" },
  { label: "Repair Guides",   emoji: "🔧", path: "/guides" },
] as const;

const INFO_ITEMS = [
  { label: "About", emoji: "ℹ️", path: "/about" },
] as const;

const EXTERNAL_ITEMS = [
  { label: "Add a missing station", emoji: "➕", href: "https://www.openstreetmap.org/edit" },
] as const;

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light",  label: "Light"  },
  { value: "dark",   label: "Dark"   },
  { value: "system", label: "System" },
];

export function MenuDrawer({ open, onClose, unit, onUnitChange }: Props) {
  const navigate = useNavigate();
  const { theme, setTheme } = useSettings();

  const go = (path: string) => { onClose(); navigate(path); };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-[1500] bg-black/40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        className={[
          "fixed left-0 top-0 bottom-0 z-[1600] w-72 flex flex-col shadow-2xl",
          "bg-white dark:bg-[#080c14]",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-[#1e2a3a]">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span className="font-bold text-sm text-slate-900 dark:text-white">BicycleRepairStations</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav links — scrollable */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <button key={item.path} onClick={() => go(item.path)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="my-2 mx-5 border-t border-slate-100 dark:border-[#1e2a3a]" />

          {INFO_ITEMS.map((item) => (
            <button key={item.path} onClick={() => go(item.path)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="my-2 mx-5 border-t border-slate-100 dark:border-[#1e2a3a]" />

          {EXTERNAL_ITEMS.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
              <svg className="ml-auto text-slate-300 dark:text-slate-600" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ))}
        </nav>

        {/* Inline settings — pinned to bottom */}
        <div className="border-t border-slate-100 dark:border-[#1e2a3a] px-5 py-4 flex flex-col gap-4">
          {/* Theme */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">Theme</span>
            <div className="flex rounded-full border border-slate-200 dark:border-[#1e2a3a] overflow-hidden">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setTheme(value)}
                  className={[
                    "text-xs font-semibold px-3 py-1.5 transition-colors",
                    value === theme
                      ? "bg-green-700 dark:bg-green-400 text-white dark:text-black"
                      : "bg-white dark:bg-[#0d1220] text-slate-500 dark:text-slate-400 active:bg-slate-50 dark:active:bg-slate-800/50",
                  ].join(" ")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">Distance</span>
            <div className="flex rounded-full border border-slate-200 dark:border-[#1e2a3a] overflow-hidden">
              {(["mi", "km"] as Unit[]).map((u) => (
                <button key={u} type="button" onClick={() => onUnitChange(u)}
                  className={[
                    "text-xs font-semibold px-4 py-1.5 transition-colors",
                    u === unit
                      ? "bg-green-700 dark:bg-green-400 text-white dark:text-black"
                      : "bg-white dark:bg-[#0d1220] text-slate-500 dark:text-slate-400 active:bg-slate-50 dark:active:bg-slate-800/50",
                  ].join(" ")}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
