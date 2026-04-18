import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/useSettings";
import type { Theme } from "../../context/SettingsContext";
import type { Unit } from "../../lib/units";
import { SUPPORTED_LOCALES } from "../../i18n/locales";
import { trackEvent, hostnameOf } from "../../lib/analytics";

interface Props {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

const NAV_ITEMS = [
  { tKey: "findStations",   emoji: "🗺️", path: "/" },
  { tKey: "repairGuides",   emoji: "🔧", path: "/guides" },
] as const;

const INFO_ITEMS = [
  { tKey: "about",     emoji: "ℹ️", path: "/about"  },
  { tKey: "reportBug", emoji: "🐞", path: "/report-bug" },
  { tKey: "donate",    emoji: "💚", path: "/donate" },
] as const;

const EXTERNAL_ITEMS = [
  { tKey: "addMissingStation", emoji: "➕", href: "https://www.openstreetmap.org/edit" },
] as const;

const THEME_OPTIONS: { value: Theme; tKey: string }[] = [
  { value: "light",  tKey: "themeLight"  },
  { value: "dark",   tKey: "themeDark"   },
  { value: "system", tKey: "themeSystem" },
];

export function MenuDrawer({ open, onClose, onShare, unit, onUnitChange }: Props) {
  const { t } = useTranslation("menu");
  const navigate = useNavigate();
  const { theme, setTheme, locale, setLocale } = useSettings();
  const panelRef = useRef<HTMLDivElement>(null);

  // Derived state: announce language changes to screen readers via the live region below.
  // Using the React "derived state during render" pattern avoids an effect and keeps
  // the region empty on initial mount (aria-live only fires on content *changes*).
  const [prevLocale, setPrevLocale] = useState(locale);
  const [langAnnouncement, setLangAnnouncement] = useState("");
  if (prevLocale !== locale) {
    setPrevLocale(locale);
    setLangAnnouncement(SUPPORTED_LOCALES.find((l) => l.code === locale)?.nativeName ?? "");
  }

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      [...panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];

    // Focus the panel container rather than the first child button.
    // Programmatic focus on a tabIndex="-1" element does not trigger
    // :focus-visible, which prevents the close button from showing its
    // focus ring on pointer-driven opens (especially on first page load
    // before any click has occurred). The focus trap below still moves
    // Tab to the first interactive element, keeping keyboard UX intact.
    panel.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousActive && previousActive.isConnected && previousActive.offsetParent !== null) {
        previousActive.focus();
      }
    };
  }, [open, onClose]);

  const go = (path: string) => {
    trackEvent("menu_nav_click", { destination: path });
    onClose();
    navigate(path);
  };

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
        ref={panelRef}
        className={[
          "fixed left-0 rtl:left-auto rtl:right-0 top-0 bottom-0 z-[1600] w-72 flex flex-col elevation-3",
          "bg-[var(--color-surface)] outline-none",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-drawer-title"
        aria-hidden={!open}
        tabIndex={-1}
        {...(!open ? { inert: true } : {})}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span id="menu-drawer-title" className="font-bold text-sm text-slate-900 dark:text-white">{t("title")}</span>
          </div>
          <button
            onClick={onClose}
            aria-label={t("closeMenu")}
            title={t("closeMenu")}
            className="w-11 h-11 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 state-surface-strong focus-ring"
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
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{t(item.tKey)}</span>
            </button>
          ))}

          <div className="my-2 mx-5 border-t border-[var(--color-border)]" />

          {INFO_ITEMS.map((item) => (
            <button key={item.path} onClick={() => go(item.path)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{t(item.tKey)}</span>
            </button>
          ))}

          <button
            onClick={onShare}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset"
          >
            <span className="text-lg leading-none w-6 text-center">🔗</span>
            <span className="font-medium">{t("shareThisApp")}</span>
          </button>

          <div className="my-2 mx-5 border-t border-[var(--color-border)]" />

          {EXTERNAL_ITEMS.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent("external_link_click", { href_host: hostnameOf(item.href) }); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span className="text-lg leading-none w-6 text-center">{item.emoji}</span>
              <span className="font-medium">{t(item.tKey)}</span>
              <svg className="ms-auto text-slate-300 dark:text-slate-600" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ))}
        </nav>

        {/* Inline settings — pinned to bottom */}
        <div className="border-t border-[var(--color-border)] px-5 py-4 flex flex-col gap-4">
          {/* Theme */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">{t("theme")}</span>
            <div className="flex rounded-full border border-[var(--color-border)] overflow-hidden">
              {THEME_OPTIONS.map(({ value, tKey }) => (
                <button key={value} type="button" onClick={() => {
                  if (value !== theme) trackEvent("theme_change", { from: theme, to: value });
                  setTheme(value);
                }}
                  className={[
                    "text-xs font-semibold px-3 py-1.5 transition-colors focus-ring-inset",
                    value === theme
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "bg-[var(--color-surface-container)] text-slate-500 dark:text-slate-400 state-surface",
                  ].join(" ")}>
                  {t(tKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">{t("distance")}</span>
            <div className="flex rounded-full border border-[var(--color-border)] overflow-hidden">
              {(["mi", "km"] as Unit[]).map((u) => (
                <button key={u} type="button" onClick={() => {
                  if (u !== unit) trackEvent("unit_change", { from: unit, to: u });
                  onUnitChange(u);
                }}
                  className={[
                    "text-xs font-semibold px-4 py-1.5 transition-colors focus-ring-inset",
                    u === unit
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "bg-[var(--color-surface-container)] text-slate-500 dark:text-slate-400 state-surface",
                  ].join(" ")}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between gap-3">
            <span id="language-select-label" className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">{t("language")}</span>
            <select
              aria-labelledby="language-select-label"
              value={locale}
              onChange={(e) => {
                const next = e.target.value;
                if (next !== locale) trackEvent("locale_change", { from: locale, to: next });
                setLocale(next);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container)] text-slate-600 dark:text-slate-300 focus-ring-inset transition-colors"
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.nativeName}</option>
              ))}
            </select>
          </div>

          {/* Screen-reader announcement for language changes */}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {langAnnouncement}
          </div>
        </div>
      </div>
    </>
  );
}
