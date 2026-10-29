import mongoose from "mongoose";
import AppError from "../utils/AppError";
import Provider from "../models/provider.model";
import { getProvider } from "../providers";
import type { ProviderResponse } from "../providers/provider.interface";
import { debitWallet, creditWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
import { createFinancialLedgerEntry } from "./financial-ledger.service";

const isTest = String(process.env.VTPASS_BASE_URL || "").toLowerCase().includes("sandbox");

interface PurchaseAirtimePayload {
  userId: string;
  network: string;
  phone: string;
  amount: number;
  batchReference?: string;
}

export const purchaseAirtime = async ({
  userId,
  network,
  phone,
  amount,
  batchReference,
}: PurchaseAirtimePayload) => {
  if (!amount || amount <= 0) {
    throw new AppError("Invalid airtime amount", 400);
  }

  const activeProvider = await Provider.findOne({
    active: true,
    supportsAirtime: true,
    activeForAirtime: true,
  }).lean();

  if (!activeProvider) {
    throw new AppError(
      "No active Airtime provider is configured.",
      503
    );
  }

  const provider = String(activeProvider.key)
    .trim()
    .toLowerCase();

  const selectedProvider = getProvider(provider);

  if (!selectedProvider) {
    throw new AppError(
      "The active Airtime provider integration is unavailable.",
      503
    );
  }

  const session = await mongoose.startSession();

  try {
    let response: any;

    console.log("\n======================================");
    console.log("AIRTIME PURCHASE STARTED");
    console.log("User ID  :", userId);
    console.log("Network  :", network);
    console.log("Phone    :", phone);
    console.log("Amount   :", amount);
    console.log("Provider :", provider);
    console.log("======================================\n");

    await session.withTransaction(async () => {
      // =====================================================
      // 1. DEBIT WALLET
      // =====================================================

      const walletResult = await debitWallet({
        userId,
        amount,
        session,
      });

      console.log("Γ£à Wallet debited successfully");
      console.log(
        "Balance Before:",
        walletResult.balanceBefore
      );
      console.log(
        "Balance After:",
        walletResult.balanceAfter
      );
      // =====================================================
      // 2. BUY AIRTIME THROUGH ADMIN-SELECTED PROVIDER
      // =====================================================

      const providerResponse: ProviderResponse =
        await selectedProvider.buyAirtime({
          network: network.toLowerCase(),
          phone: phone.trim(),
          amount,
        });

      console.log(
        "========== PROVIDER AIRTIME RESPONSE =========="
      );

      console.log(
        JSON.stringify(providerResponse, null, 2)
      );

      console.log(
        "==============================================="
      );

      // =====================================================
      // 4. PROVIDER FAILED ΓåÆ REFUND WALLET
      // =====================================================

      if (!providerResponse.success) {
        console.log(
          "Γ¥î Provider failed. Refunding wallet..."
        );

        const refundResult = await creditWallet({
          userId,
          amount,
          session,
        });

        console.log(
          "Γ£à Wallet refunded successfully"
        );

        await createTransaction({
          userId,
          type: "CREDIT",
          category: "AIRTIME",
          amount,
          status: "FAILED",
          description: `${network.toUpperCase()} Airtime Refund`,
          metadata: {
            network,
            phone,
            provider,
            providerResponse,
            isTest,
            batchReference,

            balanceBefore:
              walletResult.balanceAfter,

            balanceAfter:
              refundResult.balanceAfter,
          },
          session,
        });

        throw new AppError(
          providerResponse.message ||
            "Airtime purchase failed",
          400
        );
      }

      // =====================================================
      // 5. PROVIDER SUCCESSFUL
      // =====================================================

      console.log(
        "Γ£à Provider airtime purchase successful"
      );

      // =====================================================
      // 6. SAVE TRANSACTION
      // =====================================================

      const transaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "AIRTIME",
        amount,
        status: "SUCCESS",
        description: `${network.toUpperCase()} Airtime Purchase`,

        metadata: {
          network,
          phone,
          provider,
          providerResponse,
          isTest,
          batchReference,

          balanceBefore:
            walletResult.balanceBefore,

          balanceAfter:
            walletResult.balanceAfter,
        },

        session,
      });

      console.log("Γ£à Transaction saved");

      const providerCost = Number(providerResponse.providerCost);
      const providerCostKnown =
        Number.isFinite(providerCost) && providerCost >= 0;

      const grossProfit = providerCostKnown
        ? amount - providerCost
        : undefined;

      await createFinancialLedgerEntry({
        type: "REVENUE",
        category: "AIRTIME_SALE",
        amount,
        customerAmount: amount,
        providerCost: providerCostKnown ? providerCost : undefined,
        grossProfit,
        provider,
        service: "AIRTIME",
        user: userId,
        transaction: transaction._id,
        reference: `AIRTIME-SALE-${transaction._id}`,
        description: `${network.toUpperCase()} Airtime Sale`,
        metadata: {
          network: network.toLowerCase(),
          phone,
          providerCostKnown,
          isTest,
          batchReference,
        },
        session,
      });

      console.log("Airtime financial ledger entry saved");

      // =====================================================
      // 7. RETURN RESULT TO FRONTEND
      // =====================================================

      response = {
        success: true,

        message: "Airtime purchase successful",

        // Actual wallet balance before purchase
        balanceBefore:
          walletResult.balanceBefore,

        // Actual wallet balance after purchase
        balanceAfter:
          walletResult.balanceAfter,

        // Keep this for compatibility with existing frontend
        walletBalance:
          walletResult.balanceAfter,

        transaction,

        provider,

        providerResponse,
      };
    });

    if (!response) {
      throw new AppError(
        "Airtime purchase failed",
        500
      );
    }

    return response;
  } finally {
    await session.endSession();

    console.log(
      "========== AIRTIME PURCHASE ENDED ==========\n"
    );
  }
};
