import { vtpassProvider } from "./vtpass/vtpass.provider";
import { bigisubProvider } from "./bigisub/bigisub.provider";

export type ProviderName = "vtpass" | "bigisub";

export const getProvider = (name?: string) => {
  const provider = (name || "vtpass").toLowerCase();

  if (provider === "bigisub") {
    return bigisubProvider;
  }

  return vtpassProvider;
};
