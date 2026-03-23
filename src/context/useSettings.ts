import { useContext } from "react";
import { Ctx } from "./settingsCtx";

// Separated from SettingsContext.tsx so that file only exports React components,
// satisfying react-refresh/only-export-components.
export const useSettings = () => useContext(Ctx);
