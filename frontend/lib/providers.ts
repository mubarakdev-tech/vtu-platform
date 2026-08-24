export type ProviderId = "vtpass" | "bigisub";

export const PROVIDERS = [
  { id: "vtpass" as const, label: "Awoof", description: "Fast & reliable" },
  { id: "bigisub" as const, label: "Gift", description: "Cheap data deals" },
];

export const getProviderLabel = (id?: string) => {
  const found = PROVIDERS.find((p) => p.id === id);
  return found?.label || id || "Provider";
};