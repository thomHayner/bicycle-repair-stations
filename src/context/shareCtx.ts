import { createContext } from "react";

export type ShareEntryPoint = "toolbar" | "menu" | "about";

export interface ShareCtx {
  openShare: (entryPoint: ShareEntryPoint) => void;
  closeShare: () => void;
}

export const Ctx = createContext<ShareCtx>({
  openShare: () => {},
  closeShare: () => {},
});
