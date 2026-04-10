import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useShare } from "../context/useShare";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl elevation-1 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 type-title-small text-slate-700 dark:text-slate-200 state-surface transition-colors focus-ring-inset"
      >
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 text-slate-500 dark:text-slate-400 shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3 border-t border-[var(--color-border)]">
          {children}
        </div>
      )}
    </div>
  );
}

function LegalSection({ titleKey, bodyKey }: { titleKey: string; bodyKey: string }) {
  const { t } = useTranslation("legal");
  return (
    <p>
      <strong className="text-slate-600 dark:text-slate-300">{t(titleKey)}</strong><br/>
      {t(bodyKey)}
    </p>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("about");
  const { t: tLegal } = useTranslation("legal");
  const { t: tCommon } = useTranslation("common");
  const { openShare } = useShare();

  return (
    <>
    <div className="fixed inset-0 z-[2000] bg-[var(--color-surface-container)] flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
        <button
          onClick={() => navigate(-1)}
          aria-label={tCommon("back")}
          title={tCommon("goBack")}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 state-surface-strong transition-colors focus-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:scale-x-[-1]">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="type-title-medium text-slate-900 dark:text-white">{t("pageTitle")}</span>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p className="font-bold text-slate-900 dark:text-white text-xl">{tCommon("appName")}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="type-label-overline text-slate-500 dark:text-slate-400">{t("dataCredits")}</p>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] elevation-1">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span>{t("osmContributors")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span>{t("leafletMaps")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span>{t("cartoTiles")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://overpass-api.de" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span>{t("overpassData")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="type-label-overline text-slate-500 dark:text-slate-400">{t("contribute")}</p>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] elevation-1">
            <a href="https://www.openstreetmap.org/edit" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset">
              <span>{t("addMissingStation")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <button
              type="button"
              onClick={() => navigate("/report-bug")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset"
            >
              <span>{t("reportBug")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400 rtl:scale-x-[-1]"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button
              type="button"
              onClick={() => navigate("/donate")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset"
            >
              <span>{t("supportDonation")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400 rtl:scale-x-[-1]"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button
              type="button"
              onClick={() => openShare("about")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 state-surface focus-ring-inset"
            >
              <span>{t("shareThisApp")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="type-label-overline text-slate-500 dark:text-slate-400">{t("legal")}</p>
          <Accordion title={tLegal("privacyPolicy")}>
            <p className="pt-3"><strong className="text-slate-600 dark:text-slate-300">{tLegal("lastUpdated")}</strong></p>
            <LegalSection titleKey="privacyDataWeCollectTitle" bodyKey="privacyDataWeCollect" />
            <LegalSection titleKey="privacyLocationTitle" bodyKey="privacyLocation" />
            <LegalSection titleKey="privacyIpGeolocationTitle" bodyKey="privacyIpGeolocation" />
            <LegalSection titleKey="privacyLocalStorageTitle" bodyKey="privacyLocalStorage" />
            <LegalSection titleKey="privacySharingTitle" bodyKey="privacySharing" />
            <LegalSection titleKey="privacyThirdPartyTitle" bodyKey="privacyThirdParty" />
            <LegalSection titleKey="privacyChildrenTitle" bodyKey="privacyChildren" />
            <LegalSection titleKey="privacyContactTitle" bodyKey="privacyContact" />
          </Accordion>

          <Accordion title={tLegal("termsOfService")}>
            <p className="pt-3"><strong className="text-slate-600 dark:text-slate-300">{tLegal("lastUpdated")}</strong></p>
            <LegalSection titleKey="termsAcceptanceTitle" bodyKey="termsAcceptance" />
            <LegalSection titleKey="termsServiceTitle" bodyKey="termsService" />
            <LegalSection titleKey="termsAccuracyTitle" bodyKey="termsAccuracy" />
            <LegalSection titleKey="termsSharingTitle" bodyKey="termsSharing" />
            <LegalSection titleKey="termsWarrantyTitle" bodyKey="termsWarranty" />
            <LegalSection titleKey="termsLiabilityTitle" bodyKey="termsLiability" />
            <LegalSection titleKey="termsThirdPartyTitle" bodyKey="termsThirdParty" />
            <LegalSection titleKey="termsChangesTitle" bodyKey="termsChanges" />
          </Accordion>
        </div>
      </div>
    </div>
    </>
  );
}
