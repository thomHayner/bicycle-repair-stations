import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../lib/analytics";

export default function DonateSuccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("donate");

  useEffect(() => {
    trackEvent("donate_success_view");
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-surface-container)] flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm shrink-0">
        <button
          onClick={() => navigate("/")}
          aria-label={t("backToMap")}
          title={t("backToMap")}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 state-surface-strong transition-colors focus-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:scale-x-[-1]">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="type-title-medium text-slate-900 dark:text-white">{t("successTitle")}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-12 flex flex-col items-center gap-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-green-500">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>

        <p className="font-bold text-slate-900 dark:text-white text-xl">{t("thankYou")}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
          {t("successMessage")}
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-4 px-8 py-3 rounded-full text-sm font-bold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-95 active:brightness-90 transition-colors focus-ring"
        >
          {t("backToMap")}
        </button>
      </div>
    </div>
  );
}
