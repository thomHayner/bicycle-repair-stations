export const SUPPORTED_LOCALES = [
  { code: "en", name: "English",    nativeName: "English",    dir: "ltr" },
  { code: "de", name: "German",     nativeName: "Deutsch",    dir: "ltr" },
  { code: "fr", name: "French",     nativeName: "Fran\u00e7ais",   dir: "ltr" },
  { code: "es", name: "Spanish",    nativeName: "Espa\u00f1ol",    dir: "ltr" },
  { code: "it", name: "Italian",    nativeName: "Italiano",   dir: "ltr" },
  { code: "nl", name: "Dutch",      nativeName: "Nederlands", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Portugu\u00eas",  dir: "ltr" },
  { code: "ar", name: "Arabic",     nativeName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",     dir: "rtl" },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];
export const LOCALE_CODES = SUPPORTED_LOCALES.map((l) => l.code);
export const DEFAULT_LOCALE: LocaleCode = "en";

export const RTL_LOCALES = new Set<string>(["ar"]);
export const isRTL = (code: string) => RTL_LOCALES.has(code);

/** Countries that use imperial/miles — everyone else uses metric. */
const IMPERIAL_COUNTRIES = new Set(["US", "GB", "MM"]);
export const getDefaultUnit = (country: string): "mi" | "km" =>
  IMPERIAL_COUNTRIES.has(country) ? "mi" : "km";

/** Map IP-detected country code to a suggested locale. */
export const COUNTRY_TO_LOCALE: Partial<Record<string, LocaleCode>> = {
  // DACH
  DE: "de", AT: "de", CH: "de", LI: "de",
  // Francophone
  FR: "fr", MC: "fr",
  // Hispanic
  ES: "es", MX: "es", AR: "es", CL: "es", CO: "es", PE: "es",
  // Italian
  IT: "it", SM: "it",
  // Dutch
  NL: "nl", SR: "nl",
  // Lusophone
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  // Arabic
  SA: "ar", AE: "ar", EG: "ar", MA: "ar", DZ: "ar", IQ: "ar", JO: "ar",
  KW: "ar", QA: "ar", BH: "ar", OM: "ar", LB: "ar", LY: "ar", TN: "ar",
  YE: "ar", SY: "ar",
};

/** Convert locale code to og:locale format. */
export function toOgLocale(code: string): string {
  const map: Record<string, string> = {
    en: "en_US", de: "de_DE", fr: "fr_FR", es: "es_ES",
    it: "it_IT", nl: "nl_NL", pt: "pt_PT", ar: "ar_SA",
  };
  return map[code] ?? "en_US";
}
