import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Unit } from "../lib/units";

export type Theme = "light" | "dark" | "system";

interface SettingsCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
  unit: Unit;
  setUnit: (u: Unit) => void;
}

const Ctx = createContext<SettingsCtx>({
  theme: "system", setTheme: () => {},
  resolvedTheme: "light",
  unit:  "mi",     setUnit:  () => {},
});

function getResolved(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("brs-theme") as Theme) ?? "system"
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    () => getResolved((localStorage.getItem("brs-theme") as Theme) ?? "system")
  );
  const [unit, setUnitState] = useState<Unit>(
    () => (localStorage.getItem("brs-unit") as Unit) ?? "mi"
  );

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setResolvedTheme(getResolved(t));
    localStorage.setItem("brs-theme", t);
    applyTheme(t);
  };

  const setUnit = (u: Unit) => {
    setUnitState(u);
    localStorage.setItem("brs-unit", u);
  };

  // Apply theme on mount + listen for system preference changes
  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(getResolved(theme));
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
      setResolvedTheme(getResolved("system"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, setTheme, resolvedTheme, unit, setUnit }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSettings = () => useContext(Ctx);
