import React, { useState, useEffect, type ReactNode } from "react";
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from "@zama-fhe/relayer-sdk/bundle";
import {
  FHEContext,
  type FHEContextType,
  type FHEInstance,
} from "./FHEContext.types";

interface FHEProviderProps {
  children: ReactNode;
}

export const FHEProvider: React.FC<FHEProviderProps> = ({ children }) => {
  const [instance, setInstance] = useState<FHEInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFHE = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await initSDK(); // Load FHE
        const config = { ...SepoliaConfig, network: window.ethereum };
        const fheInstance = await createInstance(config);

        setInstance(fheInstance);
        console.log("FHE Instance initialized:", fheInstance);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to initialize FHE instance";
        setError(errorMessage);
        console.error("Failed to initialize FHE instance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initFHE();
  }, []);

  const value: FHEContextType = {
    instance,
    isLoading,
    error,
  };

  return <FHEContext.Provider value={value}>{children}</FHEContext.Provider>;
};
