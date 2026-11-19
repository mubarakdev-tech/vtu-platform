import { vtpassProvider } from "./vtpass/vtpass.provider";
import { bigisubProvider } from "./bigisub/bigisub.provider";
import type { VTUProvider } from "./provider.interface";

export type ProviderName = "vtpass" | "bigisub";

export const getProvider = (name?: string): VTUProvider => {
  const provider = (name || "vtpass").toLowerCase();

  if (provider === "bigisub") {
    return bigisubProvider;
  }

  return vtpassProvider;
};
