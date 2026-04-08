import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type LocaleCode } from "../i18n/locales";

interface Props {
  visible: boolean;
  message?: string;
  /** If set, show a first-visit language prompt instead of the spinner. */
  suggestedLocale?: LocaleCode | null;
  onLocaleChosen?: (locale: string) => void;
}

export const LoadingOverlay = memo(function LoadingOverlay({
  visible,
  message,
  suggestedLocale,
  onLocaleChosen,
}: Props) {
  const { t } = useTranslation("common");
  const panelRef = useRef<HTMLDivElement>(null);
  const isDialog = !!(suggestedLocale && onLocaleChosen);

  // Focus trap + Escape-to-close when showing the language-choice dialog.
  useEffect(() => {
    if (!visible || !isDialog) return;

    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      [...panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];

    getFocusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onLocaleChosen("en");
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, isDialog, onLocaleChosen]);

  if (!visible) return null;

  const suggested = suggestedLocale
    ? SUPPORTED_LOCALES.find((l) => l.code === suggestedLocale)
    : null;

  // When showing interactive language-choice buttons, the overlay becomes a
  // true dialog so screen readers announce it correctly and focus is trapped.
  const dialogProps = isDialog
    ? {
        role: "dialog" as const,
        "aria-modal": true,
        "aria-labelledby": "lang-prompt-title",
      }
    : {
        role: "status" as const,
        "aria-live": "polite" as const,
        "aria-atomic": true,
      };

  return (
    <div
      ref={panelRef}
      {...dialogProps}
      className={[
        "fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white dark:bg-[#080c14]",
        "transition-opacity duration-300",
        "opacity-100 pointer-events-auto",
      ].join(" ")}
    >
      {/* Bicycle + wrench logo */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h1
          id={isDialog ? "lang-prompt-title" : undefined}
          className="text-xl font-bold text-slate-900 dark:text-white"
        >
          {t("appName")}
        </h1>
      </div>

      {suggested && onLocaleChosen ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onLocaleChosen("en")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-slate-700 dark:text-slate-200 state-surface focus-ring transition-colors"
            >
              {/* "English" is intentionally hardcoded — the baseline language in a
                  language picker must always display in English regardless of locale. */}
              English
            </button>
            <button
              type="button"
              onClick={() => onLocaleChosen(suggested.code)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-95 active:brightness-90 focus-ring transition-colors"
            >
              {suggested.nativeName}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin inline-block" />
          {message ?? t("findingLocation")}
        </div>
      )}
    </div>
  );
});
