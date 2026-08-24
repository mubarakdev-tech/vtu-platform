import Provider from "../models/provider.model";
import AppError from "../utils/apperror";

import {
  AirtimePurchaseRequest,
  DataPlan,
  DataPurchaseRequest,
  ProviderResponse,
  VTUProvider,
} from "./provider.interface";

import { vtpassProvider } from "./vtpass/vtpass.provider";
import { bigisubProvider } from "./bigisub/bigisub.provider";

// ==========================================
// REGISTERED PROVIDERS
// ==========================================
//
// IMPORTANT:
//
// The frontend does NOT need to send a provider
// for normal airtime/data purchases.
//
// AbuPay automatically selects the active
// provider according to MongoDB sortOrder.
//
// Example:
//
// sortOrder 1 → VTpass
// sortOrder 2 → Bigisub
//
// Customer:
// network + phone + amount
//
// AbuPay:
// selects provider internally.
//
// ==========================================

const providerRegistry: Record<
  string,
  VTUProvider
> = {
  vtpass: vtpassProvider,
  bigisub: bigisubProvider,
};

// ==========================================
// GET ACTIVE AIRTIME PROVIDERS
// ==========================================

const getActiveAirtimeProviders =
  async (): Promise<VTUProvider[]> => {

    const databaseProviders =
      await Provider.find({
        active: true,
        supportsAirtime: true,
      })
        .sort({
          sortOrder: 1,
        })
        .lean();

    const providers: VTUProvider[] = [];

    for (
      const databaseProvider
      of databaseProviders
    ) {

      const provider =
        providerRegistry[
          databaseProvider.key
        ];

      if (!provider) {

        console.warn(
          `⚠️ Provider "${databaseProvider.key}" is active in MongoDB but has no registered implementation. Skipping.`
        );

        continue;
      }

      providers.push(provider);
    }

    return providers;
  };

// ==========================================
// GET ACTIVE DATA PROVIDERS
// ==========================================

const getActiveDataProviders =
  async (): Promise<VTUProvider[]> => {

    const databaseProviders =
      await Provider.find({
        active: true,
        supportsData: true,
      })
        .sort({
          sortOrder: 1,
        })
        .lean();

    const providers: VTUProvider[] = [];

    for (
      const databaseProvider
      of databaseProviders
    ) {

      const provider =
        providerRegistry[
          databaseProvider.key
        ];

      if (!provider) {

        console.warn(
          `⚠️ Provider "${databaseProvider.key}" is active in MongoDB but has no registered implementation. Skipping.`
        );

        continue;
      }

      providers.push(provider);
    }

    return providers;
  };

// ==========================================
// NORMALIZE PROVIDER RESPONSE
// ==========================================

const normalizeProviderResponse = (
  response: ProviderResponse,
  providerKey: string
): ProviderResponse => {

  return {
    ...response,

    provider:
      response.provider ||
      providerKey,

    retryable:
      response.retryable === true,

    uncertain:
      response.uncertain === true,
  };
};

// ==========================================
// GET DATA PLANS
// ==========================================

export const getDataPlansThroughProviders =
  async (
    network: string
  ): Promise<DataPlan[]> => {

    const normalizedNetwork =
      network
        .toLowerCase()
        .trim();

    if (!normalizedNetwork) {

      throw new AppError(
        "Network is required",
        400
      );
    }

    const providers =
      await getActiveDataProviders();

    if (providers.length === 0) {

      throw new AppError(
        "No active data provider is available",
        503
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "ABUPAY DATA PLAN PROVIDER MANAGER"
    );

    console.log(
      "Network:",
      normalizedNetwork
    );

    console.log(
      "Available providers:",
      providers.map(
        (provider) => provider.key
      )
    );

    console.log(
      "==========================================\n"
    );

    let lastError: any = null;

    for (
      const provider
      of providers
    ) {

      if (!provider.getDataPlans) {

        console.warn(
          `⚠️ Provider "${provider.key}" does not support data-plan lookup.`
        );

        continue;
      }

      console.log(
        `🔄 Getting ${normalizedNetwork} data plans from ${provider.key}`
      );

      try {

        const plans =
          await provider.getDataPlans(
            normalizedNetwork
          );

        if (
          Array.isArray(plans) &&
          plans.length > 0
        ) {

          const normalizedPlans =
            plans.map(
              (plan) => ({
                ...plan,

                provider:
                  plan.provider ||
                  provider.key,
              })
            );

          console.log(
            `✅ Received ${normalizedPlans.length} data plans from ${provider.key}`
          );

          return normalizedPlans;
        }

        console.warn(
          `⚠️ ${provider.key} returned no data plans. Trying next provider...`
        );

      } catch (error: any) {

        lastError =
          error;

        console.error(
          `❌ Failed to get data plans from ${provider.key}:`,
          error?.message ||
          error
        );

        continue;
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new AppError(
      `No data plans are currently available for ${normalizedNetwork}`,
      503
    );
  };

// ==========================================
// BUY AIRTIME
// ==========================================
//
// THIS IS THE FUNCTION YOUR AIRTIME SERVICE
// SHOULD USE.
//
// NO PROVIDER PARAMETER IS REQUIRED.
//
// AbuPay automatically selects providers
// according to MongoDB sortOrder.
//
// ==========================================

export const buyAirtimeThroughProviders =
  async (
    request: AirtimePurchaseRequest
  ): Promise<ProviderResponse> => {

    const providers =
      await getActiveAirtimeProviders();

    if (providers.length === 0) {

      throw new AppError(
        "No active airtime provider is available",
        503
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "ABUPAY AIRTIME PROVIDER MANAGER"
    );

    console.log(
      "Available providers:",
      providers.map(
        (provider) => provider.key
      )
    );

    console.log(
      "Network:",
      request.network
    );

    console.log(
      "Phone:",
      request.phone
    );

    console.log(
      "Amount:",
      request.amount
    );

    console.log(
      "==========================================\n"
    );

    let lastResponse:
      | ProviderResponse
      | undefined;

    // ========================================
    // PROVIDER PRIORITY LOOP
    // ========================================

    for (
      const provider
      of providers
    ) {

      console.log(
        `🔄 Trying airtime provider: ${provider.key}`
      );

      try {

        const rawResponse =
          await provider.buyAirtime(
            request
          );

        const response =
          normalizeProviderResponse(
            rawResponse,
            provider.key
          );

        console.log(
          `Provider ${provider.key} result:`,
          response.success
            ? "SUCCESS"
            : response.uncertain
              ? "UNCERTAIN"
              : "FAILED"
        );

        // ====================================
        // SUCCESS
        // ====================================

        if (response.success) {

          console.log(
            `✅ Airtime completed by ${provider.key}`
          );

          return response;
        }

        // ====================================
        // UNCERTAIN
        // ====================================

        if (response.uncertain) {

          console.error(
            `⚠️ Airtime transaction with ${provider.key} is UNCERTAIN.`
          );

          console.error(
            "🚫 Automatic fallback stopped."
          );

          return response;
        }

        // ====================================
        // DEFINITE FAILURE
        // ====================================

        lastResponse =
          response;

        if (response.retryable) {

          console.warn(
            `⚠️ ${provider.key} returned a retryable failure.`
          );

          console.warn(
            "➡️ Trying next provider..."
          );

          continue;
        }

        // Non-retryable failure

        console.error(
          `❌ ${provider.key} returned a non-retryable failure.`
        );

        return response;

      } catch (error: any) {

        console.error(
          `❌ Unexpected error from ${provider.key}:`,
          error
        );

        // IMPORTANT:
        //
        // We cannot know whether the provider
        // received/processed the transaction.
        //
        // Therefore mark it UNCERTAIN.
        //

        return {
          success: false,

          message:
            error?.message ||
            `Unable to determine ${provider.key} transaction status`,

          provider:
            provider.key,

          retryable: false,

          uncertain: true,

          data: error,
        };
      }
    }

    // ========================================
    // ALL PROVIDERS FAILED
    // ========================================

    return (
      lastResponse || {
        success: false,

        message:
          "All airtime providers are currently unavailable",

        retryable: false,

        uncertain: false,
      }
    );
  };

// ==========================================
// BUY DATA
// ==========================================
//
// Automatic provider selection.
// No provider required from frontend.
//
// ==========================================

export const buyDataThroughProviders =
  async (
    request: DataPurchaseRequest
  ): Promise<ProviderResponse> => {

    const providers =
      await getActiveDataProviders();

    if (providers.length === 0) {

      throw new AppError(
        "No active data provider is available",
        503
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "ABUPAY DATA PROVIDER MANAGER"
    );

    console.log(
      "Available providers:",
      providers.map(
        (provider) => provider.key
      )
    );

    console.log(
      "Network:",
      request.network
    );

    console.log(
      "Phone:",
      request.phone
    );

    console.log(
      "Plan:",
      request.plan
    );

    console.log(
      "Amount:",
      request.amount
    );

    console.log(
      "==========================================\n"
    );

    let lastResponse:
      | ProviderResponse
      | undefined;

    for (
      const provider
      of providers
    ) {

      console.log(
        `🔄 Trying data provider: ${provider.key}`
      );

      try {

        const rawResponse =
          await provider.buyData(
            request
          );

        const response =
          normalizeProviderResponse(
            rawResponse,
            provider.key
          );

        if (response.success) {

          console.log(
            `✅ Data completed by ${provider.key}`
          );

          return response;
        }

        if (response.uncertain) {

          console.error(
            `⚠️ Data transaction with ${provider.key} is UNCERTAIN.`
          );

          return response;
        }

        lastResponse =
          response;

        if (response.retryable) {

          console.warn(
            `⚠️ ${provider.key} returned a retryable failure.`
          );

          continue;
        }

        return response;

      } catch (error: any) {

        console.error(
          `❌ Unexpected error from ${provider.key}:`,
          error
        );

        return {
          success: false,

          message:
            error?.message ||
            `Unable to determine ${provider.key} transaction status`,

          provider:
            provider.key,

          retryable: false,

          uncertain: true,

          data: error,
        };
      }
    }

    return (
      lastResponse || {
        success: false,

        message:
          "All data providers are currently unavailable",

        retryable: false,

        uncertain: false,
      }
    );
  };

// ==========================================
// REGISTERED PROVIDERS
// ==========================================

export const registeredProviders =
  providerRegistry;