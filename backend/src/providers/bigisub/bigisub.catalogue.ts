import bigisubClient from "./bigisub.client";

export const BIGISUB_SYNC_NETWORKS = [
  "mtn",
  "glo",
  "airtel",
  "9mobile",
] as const;

export interface BigiSubSyncPlan {
  providerPlanCode: string;
  name: string;
  providerCost: number;
  validity: string;
}

export interface BigiSubInvalidPlan {
  providerPlanCode: string | null;
  name: string;
  reason: string;
}

export interface BigiSubCatalogueSnapshot {
  plans: BigiSubSyncPlan[];
  disabledPlans: Array<{
    providerPlanCode: string | null;
    name: string;
  }>;
  invalidPlans: BigiSubInvalidPlan[];
  complete: boolean;
}

const networkMap: Record<string, number> = {
  mtn: 1,
  glo: 2,
  airtel: 3,
  "9mobile": 4,
};

const isDisabled = (value: unknown): boolean => {
  return (
    value === true ||
    value === 1 ||
    String(value).toLowerCase() === "true" ||
    String(value) === "1"
  );
};

export const getBigiSubCatalogueForSync = async (
  network: string
): Promise<BigiSubCatalogueSnapshot> => {
  const networkId = networkMap[network];

  if (!networkId) {
    throw new Error(`Unsupported BigiSub network: ${network}`);
  }

  const response = await bigisubClient.get("/vtu/data/plans/", {
    params: { network: networkId },
  });

  const rawPlans = response.data?.data;

  if (!Array.isArray(rawPlans) || rawPlans.length === 0) {
    throw new Error(
      `BigiSub returned an empty or invalid catalogue for ${network}`
    );
  }

  const plans: BigiSubSyncPlan[] = [];
  const disabledPlans: BigiSubCatalogueSnapshot["disabledPlans"] = [];
  const invalidPlans: BigiSubInvalidPlan[] = [];

  let complete = true;

  for (const rawPlan of rawPlans as any[]) {
    const providerPlanCode =
      rawPlan?.id !== undefined && rawPlan?.id !== null
        ? String(rawPlan.id)
        : null;

    const name = [
      rawPlan?.size,
      rawPlan?.plan_volume,
      rawPlan?.plantype,
      rawPlan?.validity,
    ]
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      )
      .map(String)
      .join(" - ");

    if (isDisabled(rawPlan?.plan_disabled)) {
      disabledPlans.push({
        providerPlanCode,
        name: name || "Unnamed plan",
      });
      complete = false;
      continue;
    }

    const providerCost = Number(rawPlan?.corporate_amount);

    if (
      !providerPlanCode ||
      !Number.isFinite(providerCost) ||
      providerCost <= 0
    ) {
      invalidPlans.push({
        providerPlanCode,
        name: name || "Unnamed plan",
        reason: !providerPlanCode
          ? "Missing provider plan code"
          : "Missing or invalid corporate_amount",
      });
      complete = false;
      continue;
    }

    plans.push({
      providerPlanCode,
      name: name || `BigiSub plan ${providerPlanCode}`,
      providerCost,
      validity: String(rawPlan?.validity || ""),
    });
  }

  if (plans.length === 0) {
    throw new Error(
      `BigiSub returned no valid enabled plans for ${network}`
    );
  }

  return {
    plans,
    disabledPlans,
    invalidPlans,
    complete,
  };
};
