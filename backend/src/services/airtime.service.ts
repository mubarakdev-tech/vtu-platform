import mongoose from "mongoose";
import AppError from "../utils/apperror";
import { getProvider } from "../providers";
import { debitWallet, creditWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";

interface PurchaseAirtimePayload {
  userId: string;
  network: string;
  phone: string;
  amount: number;
  provider?: string;
}

export const purchaseAirtime = async ({
  userId,
  network,
  phone,
  amount,
  provider = "vtpass",
}: PurchaseAirtimePayload) => {
  if (!amount || amount <= 0) {
    throw new AppError("Invalid airtime amount", 400);
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

      console.log("✅ Wallet debited successfully");
      console.log(
        "Balance Before:",
        walletResult.balanceBefore
      );
      console.log(
        "Balance After:",
        walletResult.balanceAfter
      );

      // =====================================================
      // 2. GET PROVIDER
      // =====================================================

      const selectedProvider = getProvider(provider);

      if (!selectedProvider) {
        throw new AppError(
          `Provider "${provider}" is not available`,
          400
        );
      }

      // =====================================================
      // 3. BUY AIRTIME
      // =====================================================

      const providerResponse =
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
      // 4. PROVIDER FAILED → REFUND WALLET
      // =====================================================

      if (!providerResponse.success) {
        console.log(
          "❌ Provider failed. Refunding wallet..."
        );

        const refundResult = await creditWallet({
          userId,
          amount,
          session,
        });

        console.log(
          "✅ Wallet refunded successfully"
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
        "✅ Provider airtime purchase successful"
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

          balanceBefore:
            walletResult.balanceBefore,

          balanceAfter:
            walletResult.balanceAfter,
        },

        session,
      });

      console.log("✅ Transaction saved");

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