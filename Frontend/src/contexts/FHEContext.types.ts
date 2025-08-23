import { createContext } from "react";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

export type FHEInstance = FhevmInstance;

export interface FHEContextType {
  instance: FHEInstance | null;
  isLoading: boolean;
  error: string | null;
}

export const FHEContext = createContext<FHEContextType | null>(null);
