import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Unit } from "../lib/units";
import { Ctx, type Theme } from "./settingsCtx";

// Re-export Theme so existing `import type { Theme } from "./SettingsContext"` still works.
// Type-only re-exports are transparent to react-refresh.
export type { Theme };

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

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setResolvedTheme(getResolved(t));
    localStorage.setItem("brs-theme", t);
    applyTheme(t);
  }, []);

  const setUnit = useCallback((u: Unit) => {
    setUnitState(u);
    localStorage.setItem("brs-unit", u);
  }, []);

  // Apply theme on mount + listen for system preference changes.
  // setResolvedTheme is intentionally omitted here — it's handled synchronously in
  // setTheme() and initialised correctly by useState(), so no effect-based sync needed.
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
      setResolvedTheme(getResolved("system"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const ctxValue = useMemo(
    () => ({ theme, setTheme, resolvedTheme, unit, setUnit }),
    [theme, setTheme, resolvedTheme, unit, setUnit],
  );

  return (
    <Ctx.Provider value={ctxValue}>
      {children}
    </Ctx.Provider>
  );
}
