import { useContext } from "react";
import { Ctx } from "./shareCtx";

export const useShare = () => useContext(Ctx);
