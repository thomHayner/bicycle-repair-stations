import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  LOCALE_CODES,
  RTL_LOCALES,
  isRTL,
  getDefaultUnit,
  COUNTRY_TO_LOCALE,
  toOgLocale,
} from "./locales";

describe("SUPPORTED_LOCALES", () => {
  it("contains 91 locale entries", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(91);
  });

  it("every entry has code, name, nativeName, and dir fields", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(locale).toHaveProperty("code");
      expect(locale).toHaveProperty("name");
      expect(locale).toHaveProperty("nativeName");
      expect(locale).toHaveProperty("dir");
      expect(["ltr", "rtl"]).toContain(locale.dir);
    }
  });

  it("first entry is English", () => {
    expect(SUPPORTED_LOCALES[0].code).toBe("en");
  });

  it("LOCALE_CODES length matches SUPPORTED_LOCALES length", () => {
    expect(LOCALE_CODES).toHaveLength(SUPPORTED_LOCALES.length);
  });

  it("all codes in RTL_LOCALES exist in SUPPORTED_LOCALES", () => {
    for (const code of RTL_LOCALES) {
      const found = SUPPORTED_LOCALES.some((l) => l.code === code);
      expect(found, `RTL locale "${code}" not found in SUPPORTED_LOCALES`).toBe(true);
    }
  });
});

describe("isRTL", () => {
  it("returns true for Arabic", () => expect(isRTL("ar")).toBe(true));
  it("returns true for Farsi", () => expect(isRTL("fa")).toBe(true));
  it("returns true for Hebrew", () => expect(isRTL("he")).toBe(true));
  it("returns true for Urdu", () => expect(isRTL("ur")).toBe(true));
  it("returns true for Pashto", () => expect(isRTL("ps")).toBe(true));
  it("returns true for Dhivehi", () => expect(isRTL("dv")).toBe(true));
  it("returns false for English", () => expect(isRTL("en")).toBe(false));
  it("returns false for French", () => expect(isRTL("fr")).toBe(false));
  it("returns false for German", () => expect(isRTL("de")).toBe(false));
  it("returns false for Japanese", () => expect(isRTL("ja")).toBe(false));
  it("returns false for unknown code", () => expect(isRTL("xx")).toBe(false));
});

describe("getDefaultUnit", () => {
  it("returns 'mi' for US", () => expect(getDefaultUnit("US")).toBe("mi"));
  it("returns 'mi' for GB", () => expect(getDefaultUnit("GB")).toBe("mi"));
  it("returns 'mi' for Myanmar (MM)", () => expect(getDefaultUnit("MM")).toBe("mi"));
  it("returns 'km' for Germany", () => expect(getDefaultUnit("DE")).toBe("km"));
  it("returns 'km' for France", () => expect(getDefaultUnit("FR")).toBe("km"));
  it("returns 'km' for Japan", () => expect(getDefaultUnit("JP")).toBe("km"));
  it("returns 'km' for unknown country code", () => expect(getDefaultUnit("ZZ")).toBe("km"));
});

describe("COUNTRY_TO_LOCALE", () => {
  it("maps DE to 'de'", () => expect(COUNTRY_TO_LOCALE["DE"]).toBe("de"));
  it("maps JP to 'ja'", () => expect(COUNTRY_TO_LOCALE["JP"]).toBe("ja"));
  it("maps IL to 'he'", () => expect(COUNTRY_TO_LOCALE["IL"]).toBe("he"));
  it("maps BR to 'pt'", () => expect(COUNTRY_TO_LOCALE["BR"]).toBe("pt"));
  it("maps CN to 'zh'", () => expect(COUNTRY_TO_LOCALE["CN"]).toBe("zh"));
  it("maps TW to 'zh-Hant'", () => expect(COUNTRY_TO_LOCALE["TW"]).toBe("zh-Hant"));
  it("returns undefined for unmapped country", () => expect(COUNTRY_TO_LOCALE["US"]).toBeUndefined());
});

describe("toOgLocale", () => {
  it("converts 'en' to 'en_US'", () => expect(toOgLocale("en")).toBe("en_US"));
  it("converts 'de' to 'de_DE'", () => expect(toOgLocale("de")).toBe("de_DE"));
  it("converts 'zh-Hant' to 'zh_TW'", () => expect(toOgLocale("zh-Hant")).toBe("zh_TW"));
  it("converts 'zh' to 'zh_CN'", () => expect(toOgLocale("zh")).toBe("zh_CN"));
  it("converts 'ar' to 'ar_SA'", () => expect(toOgLocale("ar")).toBe("ar_SA"));
  it("falls back to 'en_US' for unknown locale code", () => expect(toOgLocale("xx-unknown")).toBe("en_US"));
});
