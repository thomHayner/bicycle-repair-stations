import { createContext } from "react";
import type { Unit } from "../lib/units";

export type Theme = "light" | "dark" | "system";

export interface SettingsCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
  unit: Unit;
  setUnit: (u: Unit) => void;
}

export const Ctx = createContext<SettingsCtx>({
  theme: "system", setTheme: () => {},
  resolvedTheme: "light",
  unit:  "mi",     setUnit:  () => {},
});
