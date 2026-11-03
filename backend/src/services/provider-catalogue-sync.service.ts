import Provider from "../models/provider.model";
import ProviderPlan from "../models/providerPlan.model";
import {
  BIGISUB_SYNC_NETWORKS,
  getBigiSubCatalogueForSync,
} from "../providers/bigisub/bigisub.catalogue";

const COST_TOLERANCE = 0.000001;

export const previewBigiSubCatalogueSync = async () => {
  const provider = await Provider.findOne({
    key: "bigisub",
    supportsData: true,
  }).lean();

  if (!provider) {
    throw new Error(
      "BigiSub provider record was not found or does not support data"
    );
  }

  const networkResults: any[] = [];

  for (const network of BIGISUB_SYNC_NETWORKS) {
    try {
      const catalogue =
        await getBigiSubCatalogueForSync(network);

      const existingPlans = await ProviderPlan.find({
        provider: provider._id,
        network,
        dataType: "DATA",
      }).lean();

      const existingByCode = new Map(
        existingPlans.map((plan: any) => [
          String(plan.providerPlanCode),
          plan,
        ])
      );

      const liveCodes = new Set(
        catalogue.plans.map(
          (plan) => plan.providerPlanCode
        )
      );

      const newPlans: any[] = [];
      const changedCosts: any[] = [];
      const unchangedPlans: any[] = [];

      for (const livePlan of catalogue.plans) {
        const existing = existingByCode.get(
          livePlan.providerPlanCode
        ) as any;

        if (!existing) {
          newPlans.push(livePlan);
          continue;
        }

        const oldCost = Number(existing.providerCost);
        const newCost = livePlan.providerCost;

        if (
          !Number.isFinite(oldCost) ||
          Math.abs(oldCost - newCost) > COST_TOLERANCE
        ) {
          changedCosts.push({
            providerPlanCode: livePlan.providerPlanCode,
            name: livePlan.name,
            previousCost: Number.isFinite(oldCost)
              ? oldCost
              : null,
            currentCost: newCost,
            difference: Number.isFinite(oldCost)
              ? Number((newCost - oldCost).toFixed(2))
              : null,
          });
        } else {
          unchangedPlans.push({
            providerPlanCode: livePlan.providerPlanCode,
            name: livePlan.name,
            providerCost: newCost,
          });
        }
      }

      // Only report missing plans when the catalogue is complete.
      // An incomplete response must never imply that plans were
      // discontinued.
      const missingPlans = catalogue.complete
        ? existingPlans
            .filter(
              (plan: any) =>
                !liveCodes.has(
                  String(plan.providerPlanCode)
                )
            )
            .map((plan: any) => ({
              providerPlanCode: plan.providerPlanCode,
              name: plan.name,
              providerCost: Number(plan.providerCost),
              reviewRequired: true,
            }))
        : [];

      networkResults.push({
        network,
        status: catalogue.complete
          ? "COMPLETE"
          : "INCOMPLETE_REVIEW_REQUIRED",
        livePlanCount: catalogue.plans.length,
        existingPlanCount: existingPlans.length,
        newPlans,
        changedCosts,
        unchangedPlans,
        missingPlans,
        disabledPlans: catalogue.disabledPlans,
        invalidPlans: catalogue.invalidPlans,
        writesPerformed: false,
      });
    } catch (error: any) {
      networkResults.push({
        network,
        status: "SYNC_CHECK_FAILED",
        error:
          error?.message ||
          "Unable to retrieve or validate provider catalogue",
        writesPerformed: false,
      });
    }
  }

  const totals = networkResults.reduce(
    (result, networkResult) => {
      result.newPlans +=
        networkResult.newPlans?.length || 0;

      result.changedCosts +=
        networkResult.changedCosts?.length || 0;

      result.unchangedPlans +=
        networkResult.unchangedPlans?.length || 0;

      result.missingPlans +=
        networkResult.missingPlans?.length || 0;

      result.disabledPlans +=
        networkResult.disabledPlans?.length || 0;

      result.invalidPlans +=
        networkResult.invalidPlans?.length || 0;

      if (
        networkResult.status !== "COMPLETE"
      ) {
        result.networksRequiringReview += 1;
      }

      return result;
    },
    {
      newPlans: 0,
      changedCosts: 0,
      unchangedPlans: 0,
      missingPlans: 0,
      disabledPlans: 0,
      invalidPlans: 0,
      networksRequiringReview: 0,
    }
  );

  return {
    success: true,
    mode: "DRY_RUN",
    provider: {
      key: provider.key,
      displayName: provider.displayName,
    },
    totals,
    networks: networkResults,
    databaseUpdated: false,
    customerSellingPricesChanged: false,
    existingMappingsChanged: false,
    historicalTransactionsChanged: false,
  };
};
