import { useContext } from "react";
import { FHEContext, type FHEContextType } from "../contexts/FHEContext.types";

export const useInstance = (): FHEContextType => {
  const context = useContext(FHEContext);

  if (!context) {
    throw new Error("useInstance must be used within a FHEProvider");
  }

  return context;
};
