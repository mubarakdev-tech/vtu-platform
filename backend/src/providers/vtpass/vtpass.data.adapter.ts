import {
  DataProvider,
  DataPlanResult,
  DataPurchaseRequest,
  DataPurchaseResult,
} from "../interfaces/data-provider.interface";

import { vtpassProvider } from "./vtpass.provider";

export const vtpassDataAdapter: DataProvider = {
  key: "vtpass",

  async getDataPlans(
    network: string,
    _dataType?: string
  ): Promise<DataPlanResult[]> {
    const plans =
      await vtpassProvider.getDataPlans(
        network
      );

    return plans.map((plan: any) => ({
      name:
        plan.name ||
        "Data Plan",

      variationCode:
        plan.variation_code,

      amount:
        Number(plan.amount || 0),

      raw: plan,
    }));
  },

  async buyData(
    request: DataPurchaseRequest
  ): Promise<DataPurchaseResult> {
    const response =
      await vtpassProvider.buyData({
        network: request.network,

        phone: request.phone,

        plan: request.planCode,

        amount: request.amount,
      });

    return {
      success:
        response.success,

      message:
        response.message,

      requestId:
        response.request_id,

      data:
        response.data,

      /*
       * For now we don't invent the provider
       * cost. The ProviderPlan catalogue will
       * supply the actual cost.
       */
      providerCost:
        undefined,
    };
  },
};