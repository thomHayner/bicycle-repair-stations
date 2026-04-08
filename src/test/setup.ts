import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock react-i18next — t() returns the key with interpolation values appended
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      const parts = Object.entries(params)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ");
      return `${key} (${parts})`;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey?: string; children?: React.ReactNode }) => i18nKey ?? null,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));
