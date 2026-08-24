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
// REGISTERED ABUPAY PROVIDERS
// ==========================================
//
// These are the provider implementations
// that AbuPay can actually communicate with.
//
// Customers can choose between the providers
// that are active and properly configured.
//
// ==========================================

const providerRegistry: Record<
  string,
  VTUProvider
> = {
  // Primary provider
  vtpass: vtpassProvider,

  // Additional customer-selectable provider
  bigisub: bigisubProvider,

  // Future providers:
  //
  // "vtu-com-ng": vtuComNgProvider,
  // rapidbills: rapidBillsProvider,
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

      // Provider exists in MongoDB but
      // implementation is not registered.
      if (!provider) {

        console.warn(
          `⚠️ Provider "${databaseProvider.key}" is active in MongoDB but has no registered implementation. Skipping safely.`
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

      // Provider exists in MongoDB but
      // implementation is not registered.
      if (!provider) {

        console.warn(
          `⚠️ Provider "${databaseProvider.key}" is active in MongoDB but has no registered implementation. Skipping safely.`
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
// GET DATA PLANS THROUGH PROVIDERS
// ==========================================
//
// This is used when AbuPay needs to retrieve
// available data plans.
//
// It can safely try another provider because
// retrieving plans does NOT purchase anything.
//
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

    let lastError:
      any = null;

    for (
      const provider
      of providers
    ) {

      // --------------------------------------
      // Provider does not support plan lookup
      // --------------------------------------

      if (
        !provider.getDataPlans
      ) {

        console.warn(
          `⚠️ Provider "${provider.key}" does not support data-plan lookup. Skipping.`
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

        console.warn(
          "➡️ Trying next available data provider..."
        );

        continue;
      }
    }

    console.error(
      `❌ No provider could return ${normalizedNetwork} data plans.`
    );

    if (lastError) {
      throw lastError;
    }

    throw new AppError(
      `No data plans are currently available for ${normalizedNetwork}`,
      503
    );
  };

// ==========================================
// BUY AIRTIME THROUGH SELECTED PROVIDER
// ==========================================
//
// IMPORTANT:
//
// This function is different from the old
// automatic fallback system.
//
// The customer can explicitly choose:
//
//   vtpass
//   bigisub
//
// AbuPay sends the transaction ONLY to the
// selected provider.
//
// ==========================================

export const buyAirtimeWithProvider =
  async (
    providerKey: string,
    request: AirtimePurchaseRequest
  ): Promise<ProviderResponse> => {

    const normalizedProviderKey =
      providerKey
        .toLowerCase()
        .trim();

    if (!normalizedProviderKey) {

      throw new AppError(
        "Provider is required",
        400
      );
    }

    const providers =
      await getActiveAirtimeProviders();

    const provider =
      providers.find(
        (item) =>
          item.key ===
          normalizedProviderKey
      );

    // ----------------------------------------
    // SELECTED PROVIDER NOT AVAILABLE
    // ----------------------------------------

    if (!provider) {

      throw new AppError(
        `Selected airtime provider "${providerKey}" is not available`,
        503
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "ABUPAY SELECTED AIRTIME PROVIDER"
    );

    console.log(
      "Provider:",
      provider.key
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

      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      if (response.success) {

        console.log(
          `✅ Airtime completed by selected provider: ${provider.key}`
        );

        return response;
      }

      // --------------------------------------
      // UNCERTAIN
      // --------------------------------------

      if (response.uncertain) {

        console.error(
          `⚠️ Airtime transaction with ${provider.key} is UNCERTAIN.`
        );

        console.error(
          "🚫 No automatic fallback will be attempted."
        );

        return response;
      }

      // --------------------------------------
      // DEFINITE FAILURE
      // --------------------------------------

      console.error(
        `❌ ${provider.key} airtime transaction failed.`
      );

      return response;

    } catch (error: any) {

      console.error(
        `❌ Unexpected error from ${provider.key}:`,
        error
      );

      // --------------------------------------
      // IMPORTANT
      // --------------------------------------
      //
      // An unexpected provider error could
      // mean the provider received the request.
      //
      // Therefore we mark it UNCERTAIN.
      //
      // We NEVER automatically send the same
      // transaction to another provider.
      // --------------------------------------

      return {

        success: false,

        message:
          error?.message ||
          `Unable to determine ${provider.key} transaction status`,

        provider:
          provider.key,

        retryable:
          false,

        uncertain:
          true,

        data:
          error,
      };
    }
  };

// ==========================================
// BUY DATA THROUGH SELECTED PROVIDER
// ==========================================
//
// Customer will eventually be able to select:
//
//   VTpass
//   Bigisub
//
// ==========================================

export const buyDataWithProvider =
  async (
    providerKey: string,
    request: DataPurchaseRequest
  ): Promise<ProviderResponse> => {

    const normalizedProviderKey =
      providerKey
        .toLowerCase()
        .trim();

    if (!normalizedProviderKey) {

      throw new AppError(
        "Provider is required",
        400
      );
    }

    const providers =
      await getActiveDataProviders();

    const provider =
      providers.find(
        (item) =>
          item.key ===
          normalizedProviderKey
      );

    if (!provider) {

      throw new AppError(
        `Selected data provider "${providerKey}" is not available`,
        503
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "ABUPAY SELECTED DATA PROVIDER"
    );

    console.log(
      "Provider:",
      provider.key
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

      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      if (response.success) {

        console.log(
          `✅ Data completed by selected provider: ${provider.key}`
        );

        return response;
      }

      // --------------------------------------
      // UNCERTAIN
      // --------------------------------------

      if (response.uncertain) {

        console.error(
          `⚠️ Data transaction with ${provider.key} is UNCERTAIN.`
        );

        console.error(
          "🚫 No automatic fallback will be attempted."
        );

        return response;
      }

      // --------------------------------------
      // DEFINITE FAILURE
      // --------------------------------------

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

        retryable:
          false,

        uncertain:
          true,

        data:
          error,
      };
    }
  };

// ==========================================
// BACKWARD COMPATIBILITY
// ==========================================
//
// Keep the old functions for now so existing
// code does not immediately break.
//
// IMPORTANT:
// These functions still use the existing
// provider-manager selection/order behavior.
//
// New customer-selection code should use:
//
// buyAirtimeWithProvider()
// buyDataWithProvider()
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

    let lastResponse:
      | ProviderResponse
      | undefined;

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

        if (response.success) {

          return response;
        }

        if (response.uncertain) {

          return response;
        }

        lastResponse =
          response;

        if (response.retryable) {

          continue;
        }

        return response;

      } catch (error: any) {

        return {

          success: false,

          message:
            error?.message ||
            `Unable to determine ${provider.key} transaction status`,

          provider:
            provider.key,

          retryable:
            false,

          uncertain:
            true,

          data:
            error,
        };
      }
    }

    return (
      lastResponse || {

        success: false,

        message:
          "All airtime providers are currently unavailable",

        retryable:
          false,

        uncertain:
          false,
      }
    );
  };

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

          return response;
        }

        if (response.uncertain) {

          return response;
        }

        lastResponse =
          response;

        if (response.retryable) {

          continue;
        }

        return response;

      } catch (error: any) {

        return {

          success: false,

          message:
            error?.message ||
            `Unable to determine ${provider.key} transaction status`,

          provider:
            provider.key,

          retryable:
            false,

          uncertain:
            true,

          data:
            error,
        };
      }
    }

    return (
      lastResponse || {

        success: false,

        message:
          "All data providers are currently unavailable",

        retryable:
          false,

        uncertain:
          false,
      }
    );
  };

// ==========================================
// REGISTERED PROVIDERS
// ==========================================
//
// Useful for diagnostics/admin dashboard.
// ==========================================

export const registeredProviders =
  providerRegistry;