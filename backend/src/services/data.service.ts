import mongoose from "mongoose";
import AppError from "../utils/AppError";
import { getProvider } from "../providers";
import { debitWallet, creditWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";

type BuyDataInput = {
  userId: string;
  network: string;
  phone: string;
  plan: string;
  amount: number;
  provider?: string;
};

export const buyData = async ({
  userId,
  network,
  phone,
  plan,
  amount,
  provider = "vtpass",
}: BuyDataInput) => {
  // ==========================================
  // VALIDATION
  // ==========================================

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (
    !network ||
    !phone ||
    !plan ||
    amount === undefined ||
    amount === null
  ) {
    throw new AppError(
      "network, phone, plan and amount are required",
      400
    );
  }

  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError("Invalid amount", 400);
  }

  // ==========================================
  // NORMALIZE PROVIDER
  // ==========================================

  const providerName = String(provider || "vtpass")
    .toLowerCase()
    .trim();

  /*
   * IMPORTANT:
   *
   * This allows either of your configured providers
   * to handle the purchase.
   *
   * Provider name is kept internally only.
   * It is NOT displayed to customers.
   */

  const selectedProvider = getProvider(providerName);

  if (!selectedProvider) {
    throw new AppError(
      `Provider "${providerName}" is not available`,
      400
    );
  }

  if (typeof selectedProvider.buyData !== "function") {
    throw new AppError(
      "Selected provider does not support data purchase",
      400
    );
  }

  const session = await mongoose.startSession();

  try {
    let response: any = null;

    await session.withTransaction(async () => {
      // ==========================================
      // 1. DEBIT WALLET
      // ==========================================

      const walletResult = await debitWallet({
        userId,
        amount: value,
        session,
      });

      console.log("\n======================================");
      console.log("DATA PURCHASE STARTED");
      console.log("User ID:", userId);
      console.log("Network:", network);
      console.log("Phone:", phone);
      console.log("Plan:", plan);
      console.log("Amount:", value);

      // Provider is logged internally only.
      console.log("Provider:", providerName);

      console.log(
        "Balance Before:",
        walletResult.balanceBefore
      );

      console.log(
        "Balance After:",
        walletResult.balanceAfter
      );

      console.log("======================================\n");

      // ==========================================
      // 2. CALL SELECTED PROVIDER
      // ==========================================

      const providerResult =
        await selectedProvider.buyData({
          network: network.toLowerCase(),
          phone: phone.trim(),
          plan,
          amount: value,
        });

      console.log(
        "========== DATA PROVIDER RESPONSE =========="
      );

      console.log(
        JSON.stringify(providerResult, null, 2)
      );

      console.log(
        "============================================"
      );

      // ==========================================
      // 3. PROVIDER FAILED
      // ==========================================

      if (!providerResult?.success) {
        console.log(
          "Data provider failed. Refunding wallet..."
        );

        // ----------------------------------------
        // REFUND WALLET
        // ----------------------------------------

        const refundResult = await creditWallet({
          userId,
          amount: value,
          session,
        });

        console.log(
          "Wallet refunded successfully."
        );

        console.log(
          "Refund Balance:",
          refundResult.balanceAfter
        );

        // ----------------------------------------
        // RECORD FAILED TRANSACTION
        // ----------------------------------------

        await createTransaction({
          userId,

          type: "CREDIT",

          category: "DATA",

          amount: value,

          status: "FAILED",

          description:
            `${network.toUpperCase()} Data Refund`,

          metadata: {
            network,
            phone,
            plan,

            /*
             * INTERNAL ONLY.
             *
             * Useful for admin/accounting.
             * Do not display this on customer UI.
             */
            provider: providerName,

            providerResponse: providerResult,

            balanceBefore:
              walletResult.balanceAfter,

            balanceAfter:
              refundResult.balanceAfter,
          },

          session,
        });

        // ----------------------------------------
        // RETURN FAILURE
        // ----------------------------------------

        response = {
          success: false,

          message:
            providerResult?.message ||
            "Data purchase failed",

          balanceBefore:
            walletResult.balanceBefore,

          amountPaid: value,

          balanceAfter:
            refundResult.balanceAfter,

          walletBalance:
            refundResult.balanceAfter,

          providerResponse:
            providerResult?.data ||
            providerResult,
        };

        return;
      }

      // ==========================================
      // 4. PROVIDER SUCCESS
      // ==========================================

      console.log(
        "Data provider purchase successful."
      );

      // ==========================================
      // 5. SAVE SUCCESSFUL TRANSACTION
      // ==========================================

      const transaction = await createTransaction({
        userId,

        type: "DEBIT",

        category: "DATA",

        amount: value,

        status: "SUCCESS",

        description:
          `${network.toUpperCase()} Data Purchase`,

        metadata: {
          network,
          phone,
          plan,

          /*
           * INTERNAL ONLY.
           *
           * This lets you know which provider
           * processed the transaction.
           *
           * It should NOT be displayed to customers.
           */
          provider: providerName,

          providerResponse: providerResult,

          balanceBefore:
            walletResult.balanceBefore,

          balanceAfter:
            walletResult.balanceAfter,
        },

        session,
      });

      console.log(
        "Data transaction saved:",
        transaction?._id
      );

      // ==========================================
      // 6. RETURN SUCCESS
      // ==========================================

      response = {
        success: true,

        message:
          providerResult?.message ||
          "Data purchase successful",

        // Wallet information
        balanceBefore:
          walletResult.balanceBefore,

        amountPaid: value,

        balanceAfter:
          walletResult.balanceAfter,

        walletBalance:
          walletResult.balanceAfter,

        // Transaction
        transaction,

        /*
         * Provider response is returned for
         * internal/frontend processing.
         *
         * We DO NOT return providerName separately.
         */
        providerResponse:
          providerResult?.data ||
          providerResult,
      };
    });

    // ==========================================
    // SAFETY CHECK
    // ==========================================

    if (!response) {
      throw new AppError(
        "Data purchase failed",
        500
      );
    }

    return response;
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "BUY DATA SERVICE ERROR:"
    );

    console.error(
      error?.message || error
    );

    console.error(
      "======================================"
    );

    /*
     * withTransaction() automatically handles
     * transaction rollback when an error is thrown.
     *
     * Therefore we DO NOT manually credit the
     * wallet here.
     *
     * This prevents double refunds.
     */

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error?.message ||
        "Data purchase failed",
      500
    );
  } finally {
    await session.endSession();

    console.log(
      "========== DATA PURCHASE ENDED ==========\n"
    );
  }
};
