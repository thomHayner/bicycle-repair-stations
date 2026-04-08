export const SUPPORTED_LOCALES = [
  { code: "en", name: "English",    nativeName: "English",    dir: "ltr" },
  { code: "de", name: "German",     nativeName: "Deutsch",    dir: "ltr" },
  { code: "fr", name: "French",     nativeName: "Français",   dir: "ltr" },
  { code: "es", name: "Spanish",    nativeName: "Español",    dir: "ltr" },
  { code: "it", name: "Italian",    nativeName: "Italiano",   dir: "ltr" },
  { code: "nl", name: "Dutch",      nativeName: "Nederlands", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português",  dir: "ltr" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",     dir: "rtl" },
  { code: "fa", name: "Farsi",      nativeName: "فارسی",      dir: "rtl" },
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",     dir: "ltr" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",      dir: "ltr" },
  { code: "ko", name: "Korean",     nativeName: "한국어",       dir: "ltr" },
  { code: "zh", name: "Chinese",    nativeName: "中文",        dir: "ltr" },
  { code: "zh-Hant", name: "Chinese (Traditional)", nativeName: "繁體中文", dir: "ltr" },
  { code: "tl", name: "Tagalog",    nativeName: "Tagalog",    dir: "ltr" },
  { code: "th", name: "Thai",       nativeName: "ไทย",        dir: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
  { code: "ru", name: "Russian",    nativeName: "Русский",    dir: "ltr" },
  { code: "pl", name: "Polish",     nativeName: "Polski",     dir: "ltr" },
  { code: "da", name: "Danish",     nativeName: "Dansk",      dir: "ltr" },
  { code: "nb", name: "Norwegian",  nativeName: "Norsk",      dir: "ltr" },
  { code: "sv", name: "Swedish",    nativeName: "Svenska",    dir: "ltr" },
  { code: "fi", name: "Finnish",    nativeName: "Suomi",      dir: "ltr" },
  { code: "el", name: "Greek",      nativeName: "Ελληνικά",   dir: "ltr" },
  { code: "ht", name: "Creole",     nativeName: "Kreyòl",     dir: "ltr" },
  { code: "uk", name: "Ukrainian",  nativeName: "Українська", dir: "ltr" },
  { code: "et", name: "Estonian",   nativeName: "Eesti",      dir: "ltr" },
  { code: "hu", name: "Hungarian",  nativeName: "Magyar",     dir: "ltr" },
  { code: "sl", name: "Slovenian",  nativeName: "Slovenščina", dir: "ltr" },
  { code: "hr", name: "Croatian",   nativeName: "Hrvatski",   dir: "ltr" },
  { code: "sr", name: "Serbian",    nativeName: "Српски",     dir: "ltr" },
  { code: "bs", name: "Bosnian",    nativeName: "Bosanski",   dir: "ltr" },
  { code: "cnr", name: "Montenegrin", nativeName: "Crnogorski", dir: "ltr" },
  { code: "sq", name: "Albanian",   nativeName: "Shqip",      dir: "ltr" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски", dir: "ltr" },
  { code: "bg", name: "Bulgarian",  nativeName: "Български",  dir: "ltr" },
  { code: "ro", name: "Romanian",   nativeName: "Română",     dir: "ltr" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", dir: "ltr" },
  { code: "uz", name: "Uzbek",      nativeName: "Oʻzbek",     dir: "ltr" },
  { code: "ur", name: "Urdu",       nativeName: "اردو",        dir: "rtl" },
  { code: "ka", name: "Georgian",   nativeName: "ქართული",    dir: "ltr" },
  { code: "hy", name: "Armenian",   nativeName: "Հայերեն",     dir: "ltr" },
  { code: "ne", name: "Nepali",     nativeName: "नेपाली",       dir: "ltr" },
  { code: "mn", name: "Mongolian",  nativeName: "Монгол",     dir: "ltr" },
  { code: "ms", name: "Malay",      nativeName: "Bahasa Melayu", dir: "ltr" },
  { code: "he", name: "Hebrew",     nativeName: "עברית",       dir: "rtl" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr" },
  { code: "my", name: "Burmese",    nativeName: "မြန်မာ",       dir: "ltr" },
  { code: "km", name: "Khmer",      nativeName: "ខ្មែរ",        dir: "ltr" },
  { code: "lo", name: "Lao",        nativeName: "ລາວ",        dir: "ltr" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių",   dir: "ltr" },
  { code: "lv", name: "Latvian",    nativeName: "Latviešu",   dir: "ltr" },
  { code: "cs", name: "Czech",      nativeName: "Čeština",    dir: "ltr" },
  { code: "sk", name: "Slovak",     nativeName: "Slovenčina", dir: "ltr" },
  { code: "kk", name: "Kazakh",     nativeName: "Қазақ",      dir: "ltr" },
  { code: "af", name: "Afrikaans",  nativeName: "Afrikaans",  dir: "ltr" },
  { code: "is", name: "Icelandic",  nativeName: "Íslenska",   dir: "ltr" },
  { code: "ca", name: "Catalan",    nativeName: "Català",     dir: "ltr" },
  { code: "ku", name: "Kurdish",    nativeName: "Kurdî",      dir: "ltr" },
  { code: "ky", name: "Kyrgyz",     nativeName: "Кыргызча",   dir: "ltr" },
  { code: "tk", name: "Turkmen",    nativeName: "Türkmen",    dir: "ltr" },
  // Africa
  { code: "sw", name: "Swahili",    nativeName: "Kiswahili",  dir: "ltr" },
  { code: "am", name: "Amharic",    nativeName: "አማርኛ",       dir: "ltr" },
  { code: "ha", name: "Hausa",      nativeName: "Hausa",      dir: "ltr" },
  { code: "yo", name: "Yoruba",     nativeName: "Yorùbá",     dir: "ltr" },
  { code: "ig", name: "Igbo",       nativeName: "Igbo",       dir: "ltr" },
  { code: "so", name: "Somali",     nativeName: "Soomaali",   dir: "ltr" },
  { code: "zu", name: "Zulu",       nativeName: "isiZulu",    dir: "ltr" },
  { code: "mg", name: "Malagasy",   nativeName: "Malagasy",   dir: "ltr" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Kinyarwanda", dir: "ltr" },
  // Indian subcontinent
  { code: "hi", name: "Hindi",      nativeName: "हिन्दी",       dir: "ltr" },
  { code: "bn", name: "Bengali",    nativeName: "বাংলা",       dir: "ltr" },
  { code: "ta", name: "Tamil",      nativeName: "தமிழ்",       dir: "ltr" },
  { code: "te", name: "Telugu",     nativeName: "తెలుగు",      dir: "ltr" },
  { code: "mr", name: "Marathi",    nativeName: "मराठी",       dir: "ltr" },
  { code: "gu", name: "Gujarati",   nativeName: "ગુજરાતી",    dir: "ltr" },
  { code: "kn", name: "Kannada",    nativeName: "ಕನ್ನಡ",       dir: "ltr" },
  { code: "ml", name: "Malayalam",  nativeName: "മലയാളം",     dir: "ltr" },
  { code: "pa", name: "Punjabi",    nativeName: "ਪੰਜਾਬੀ",      dir: "ltr" },
  { code: "si", name: "Sinhala",    nativeName: "සිංහල",      dir: "ltr" },
  { code: "or", name: "Odia",       nativeName: "ଓଡ଼ିଆ",       dir: "ltr" },
  // Leftover gaps
  { code: "ps", name: "Pashto",     nativeName: "پښتو",       dir: "rtl" },
  { code: "mt", name: "Maltese",    nativeName: "Malti",      dir: "ltr" },
  { code: "tg", name: "Tajik",      nativeName: "Тоҷикӣ",     dir: "ltr" },
  { code: "ti", name: "Tigrinya",   nativeName: "ትግርኛ",      dir: "ltr" },
  { code: "ga", name: "Irish",      nativeName: "Gaeilge",    dir: "ltr" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch", dir: "ltr" },
  { code: "eu", name: "Basque",     nativeName: "Euskara",    dir: "ltr" },
  { code: "tt", name: "Tatar",      nativeName: "Татарча",    dir: "ltr" },
  { code: "dz", name: "Dzongkha",   nativeName: "རྫོང་ཁ",      dir: "ltr" },
  { code: "dv", name: "Dhivehi",    nativeName: "ދިވެހި",      dir: "rtl" },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];
export const LOCALE_CODES = SUPPORTED_LOCALES.map((l) => l.code);
export const DEFAULT_LOCALE: LocaleCode = "en";

export const RTL_LOCALES = new Set<string>(["ar", "fa", "ur", "he", "ps", "dv"]);
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
  YE: "ar", SY: "ar", PS: "ar",
  // Farsi
  IR: "fa",
  // Turkish
  TR: "tr", CY: "tr",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
  // Chinese
  CN: "zh", SG: "zh",
  // Traditional Chinese
  TW: "zh-Hant", HK: "zh-Hant", MO: "zh-Hant",
  // Tagalog
  PH: "tl",
  // Thai
  TH: "th",
  // Vietnamese
  VN: "vi",
  // Russian
  RU: "ru", BY: "ru",
  // Polish
  PL: "pl",
  // Danish
  DK: "da",
  // Norwegian
  NO: "nb",
  // Swedish
  SE: "sv",
  // Finnish
  FI: "fi",
  // Greek
  GR: "el",
  // Creole
  HT: "ht",
  // Ukrainian
  UA: "uk",
  // Estonian
  EE: "et",
  // Hungarian
  HU: "hu",
  // Slovenian
  SI: "sl",
  // Croatian
  HR: "hr",
  // Serbian
  RS: "sr",
  // Bosnian (Bosnia and Herzegovina)
  BA: "bs",
  // Montenegrin
  ME: "cnr",
  // Albanian
  AL: "sq", XK: "sq",
  // Macedonian
  MK: "mk",
  // Bulgarian
  BG: "bg",
  // Romanian
  RO: "ro", MD: "ro",
  // Azerbaijani
  AZ: "az",
  // Uzbek
  UZ: "uz",
  // Urdu
  PK: "ur",
  // Georgian
  GE: "ka",
  // Armenian
  AM: "hy",
  // Nepali
  NP: "ne",
  // Mongolian
  MN: "mn",
  // Malay
  MY: "ms",
  // Hebrew
  IL: "he",
  // Indonesian
  ID: "id",
  // Burmese (MM is also in IMPERIAL_COUNTRIES for unit detection)
  MM: "my",
  // Khmer
  KH: "km",
  // Lao
  LA: "lo",
  // Lithuanian
  LT: "lt",
  // Latvian
  LV: "lv",
  // Czech
  CZ: "cs",
  // Slovak
  SK: "sk",
  // Kazakh
  KZ: "kk",
  // Afrikaans
  ZA: "af",
  // Icelandic
  IS: "is",
  // Catalan (Andorra; Catalonia uses ES → "es")
  AD: "ca",
  // Kurdish (Iraq Kurdistan region — country-level maps to Arabic)
  // Kurdish speakers in TR/IQ/SY/IR will need to manually select Kurdish
  // Kyrgyz
  KG: "ky",
  // Turkmen
  TM: "tk",
  // Swahili (East Africa)
  KE: "sw", TZ: "sw", UG: "sw", RW: "sw",
  // Amharic
  ET: "am",
  // Hausa
  NG: "ha",
  // Somali
  SO: "so", DJ: "so",
  // Zulu (South Africa already mapped to af — ZA stays af, Zulu is manual select)
  // Malagasy
  MG: "mg",
  // Kinyarwanda (RW already mapped to sw above — Kinyarwanda is manual select)
  // Hindi
  IN: "hi",
  // Bengali
  BD: "bn",
  // Sinhala
  LK: "si",
  // Pashto (Afghanistan — Pashto is the most common, Dari/Farsi is manual select)
  AF: "ps",
  // Maltese
  MT: "mt",
  // Tajik
  TJ: "tg",
  // Tigrinya
  ER: "ti",
  // Irish
  IE: "ga",
  // Luxembourgish
  LU: "lb",
  // Basque (speakers in ES/FR will need to manually select — no country-level mapping)
  // Tatar (Tatarstan is within Russia — Tatar speakers will need to manually select)
  // Dzongkha
  BT: "dz",
  // Dhivehi
  MV: "dv",
  // Additional country mappings for existing languages
  BN: "ms", TL: "pt", KP: "ko",
};

/** Convert locale code to og:locale format. */
export function toOgLocale(code: string): string {
  const map: Record<string, string> = {
    en: "en_US", de: "de_DE", fr: "fr_FR", es: "es_ES",
    it: "it_IT", nl: "nl_NL", pt: "pt_PT", ar: "ar_SA",
    fa: "fa_IR", tr: "tr_TR", ja: "ja_JP", ko: "ko_KR",
    zh: "zh_CN", tl: "tl_PH", th: "th_TH", vi: "vi_VN",
    ru: "ru_RU", pl: "pl_PL", da: "da_DK", nb: "nb_NO",
    sv: "sv_SE", fi: "fi_FI", el: "el_GR", ht: "ht_HT",
    uk: "uk_UA", et: "et_EE", hu: "hu_HU", sl: "sl_SI",
    hr: "hr_HR", sr: "sr_RS", bs: "bs_BA", cnr: "sr_ME",
    sq: "sq_AL", mk: "mk_MK", bg: "bg_BG", ro: "ro_RO",
    az: "az_AZ", uz: "uz_UZ", ur: "ur_PK", ka: "ka_GE",
    hy: "hy_AM", ne: "ne_NP", mn: "mn_MN", ms: "ms_MY",
    he: "he_IL", id: "id_ID", my: "my_MM", km: "km_KH",
    lo: "lo_LA", lt: "lt_LT", lv: "lv_LV", cs: "cs_CZ",
    sk: "sk_SK", kk: "kk_KZ", "zh-Hant": "zh_TW", af: "af_ZA",
    is: "is_IS", ca: "ca_ES", ku: "ku_TR", ky: "ky_KG", tk: "tk_TM",
    sw: "sw_KE", am: "am_ET", ha: "ha_NG", yo: "yo_NG", ig: "ig_NG",
    so: "so_SO", zu: "zu_ZA", mg: "mg_MG", rw: "rw_RW",
    hi: "hi_IN", bn: "bn_BD", ta: "ta_IN", te: "te_IN", mr: "mr_IN",
    gu: "gu_IN", kn: "kn_IN", ml: "ml_IN", pa: "pa_IN", si: "si_LK",
    or: "or_IN", ps: "ps_AF", mt: "mt_MT", tg: "tg_TJ", ti: "ti_ER",
    ga: "ga_IE", lb: "lb_LU", eu: "eu_ES",
    tt: "tt_RU", dz: "dz_BT", dv: "dv_MV",
  };
  return map[code] ?? "en_US";
}
