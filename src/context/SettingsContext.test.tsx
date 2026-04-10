import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsProvider } from "./SettingsContext";
import { useSettings } from "./useSettings";

vi.mock("../i18n", () => ({
  default: {
    t: (k: string) => k,
    language: "en",
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

function Consumer() {
  const { theme, unit, locale, resolvedTheme } = useSettings();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <span data-testid="unit">{unit}</span>
      <span data-testid="locale">{locale}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </>
  );
}

function ConsumerWithActions() {
  const { theme, setTheme, resolvedTheme, unit, setUnit, locale, setLocale } = useSettings();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <span data-testid="unit">{unit}</span>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setTheme("dark")}>set dark</button>
      <button onClick={() => setTheme("light")}>set light</button>
      <button onClick={() => setTheme("system")}>set system</button>
      <button onClick={() => setUnit("km")}>set km</button>
      <button onClick={() => setLocale("ar")}>set arabic</button>
      <button onClick={() => setLocale("en")}>set english</button>
    </>
  );
}

function renderWithProvider(ui = <Consumer />) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.dir = "ltr";
  document.documentElement.lang = "en";
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("SettingsProvider — defaults", () => {
  it("defaults to theme=system, unit=mi, locale=en", () => {
    renderWithProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("unit")).toHaveTextContent("mi");
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("reads persisted theme from localStorage on mount", () => {
    localStorage.setItem("brs-theme", "dark");
    renderWithProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("reads persisted unit from localStorage on mount", () => {
    localStorage.setItem("brs-unit", "km");
    renderWithProvider();
    expect(screen.getByTestId("unit")).toHaveTextContent("km");
  });

  it("reads persisted locale from localStorage on mount", () => {
    localStorage.setItem("brs-locale", "fr");
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("fr");
  });
});

describe("SettingsProvider — setTheme", () => {
  it("setTheme('dark') persists to localStorage and adds dark class to <html>", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set dark"));
    await waitFor(() =>
      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    );
    expect(localStorage.getItem("brs-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('light') removes dark class from <html>", async () => {
    document.documentElement.classList.add("dark");
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set light"));
    await waitFor(() =>
      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("brs-theme")).toBe("light");
  });

  it("resolvedTheme is 'dark' when theme is 'dark'", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set dark"));
    await waitFor(() =>
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark")
    );
  });

  it("resolvedTheme is 'light' when theme is 'light'", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set light"));
    await waitFor(() =>
      expect(screen.getByTestId("resolved")).toHaveTextContent("light")
    );
  });

  it("system theme resolves to 'dark' when matchMedia reports dark mode", async () => {
    // Override matchMedia to report dark preference
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true, // dark mode
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set system"));
    await waitFor(() =>
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark")
    );
  });
});

describe("SettingsProvider — setUnit", () => {
  it("setUnit('km') persists to localStorage", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set km"));
    await waitFor(() =>
      expect(screen.getByTestId("unit")).toHaveTextContent("km")
    );
    expect(localStorage.getItem("brs-unit")).toBe("km");
  });
});

describe("SettingsProvider — setLocale", () => {
  it("setLocale('ar') sets dir=rtl and lang=ar on <html>", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set arabic"));
    await waitFor(() =>
      expect(screen.getByTestId("locale")).toHaveTextContent("ar")
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(localStorage.getItem("brs-locale")).toBe("ar");
  });

  it("setLocale('en') sets dir=ltr and lang=en on <html>", async () => {
    renderWithProvider(<ConsumerWithActions />);
    fireEvent.click(screen.getByText("set arabic")); // first set RTL
    fireEvent.click(screen.getByText("set english")); // then back to LTR
    await waitFor(() =>
      expect(document.documentElement.dir).toBe("ltr")
    );
    expect(document.documentElement.lang).toBe("en");
  });
});
