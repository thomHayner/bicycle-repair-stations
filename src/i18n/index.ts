import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { LOCALE_CODES, DEFAULT_LOCALE } from "./locales";

// English translations are bundled statically for instant load.
// All other locales are loaded at runtime from /locales/{lng}/{ns}.json.
import commonEn from "../../public/locales/en/common.json";
import mapEn from "../../public/locales/en/map.json";
import menuEn from "../../public/locales/en/menu.json";
import shareEn from "../../public/locales/en/share.json";
import aboutEn from "../../public/locales/en/about.json";
import legalEn from "../../public/locales/en/legal.json";
import donateEn from "../../public/locales/en/donate.json";
import guidesEn from "../../public/locales/en/guides.json";
import reportBugEn from "../../public/locales/en/reportBug.json";

const NAMESPACES = [
  "common", "map", "menu", "share", "about", "legal", "donate", "guides", "reportBug",
] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALE_CODES,
    ns: [...NAMESPACES],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "brs-locale",
      caches: ["localStorage"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    // Bundle English so it's always available instantly
    partialBundledLanguages: true,
    resources: {
      en: {
        common: commonEn,
        map: mapEn,
        menu: menuEn,
        share: shareEn,
        about: aboutEn,
        legal: legalEn,
        donate: donateEn,
        guides: guidesEn,
        reportBug: reportBugEn,
      },
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
