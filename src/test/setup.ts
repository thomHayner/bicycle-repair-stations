import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement matchMedia — stub it so SettingsContext and any
// component that checks system dark-mode preference doesn't throw.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
