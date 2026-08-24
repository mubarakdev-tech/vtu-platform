import mongoose from "mongoose";
import AppError from "../utils/AppError";
import { getProvider } from "../providers";
import { debitWallet, creditWallet } from "./wallet.service";

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

  const providerName = String(provider || "vtpass")
    .toLowerCase()
    .trim();

  const selectedProvider = getProvider(providerName);

  if (
    !selectedProvider ||
    typeof selectedProvider.buyData !== "function"
  ) {
    throw new AppError(
      "Selected provider does not support data purchase",
      400
    );
  }

  const session = await mongoose.startSession();

  session.startTransaction();

  let debited = false;

  let balanceBefore = 0;
  let balanceAfter = 0;

  try {
    /*
     * DEBIT WALLET
     *
     * debitWallet returns:
     * - balanceBefore
     * - balanceAfter
     */
    const walletDebit = await debitWallet({
      userId,
      amount: value,
      session,
    });

    debited = true;

    balanceBefore = walletDebit.balanceBefore;
    balanceAfter = walletDebit.balanceAfter;

    console.log("========== DATA WALLET DEBIT ==========");
    console.log("Balance Before:", balanceBefore);
    console.log("Amount Paid   :", value);
    console.log("Balance After :", balanceAfter);
    console.log("=======================================");

    /*
     * CALL PROVIDER
     */
    const providerResult = await selectedProvider.buyData({
      network: network.toLowerCase(),
      phone: phone.trim(),
      plan,
      amount: value,
    });

    console.log(
      "DATA PROVIDER RESULT:",
      JSON.stringify(providerResult, null, 2)
    );

    /*
     * PROVIDER FAILED
     *
     * Refund the customer's wallet.
     */
    if (!providerResult?.success) {
      const refund = await creditWallet({
        userId,
        amount: value,
        session,
      });

      console.log("========== DATA REFUND ==========");
      console.log("Refund Amount :", value);
      console.log("Balance After :", refund.balanceAfter);
      console.log("=================================");

      await session.commitTransaction();
      session.endSession();

      return {
        success: false,
        message:
          providerResult?.message ||
          "Data purchase failed",

        provider: providerName,

        providerResponse:
          providerResult?.data || providerResult,

        walletBalance: refund.balanceAfter,

        balanceBefore,
        amountPaid: value,
        balanceAfter: refund.balanceAfter,
      };
    }

    /*
     * PURCHASE SUCCESSFUL
     */
    await session.commitTransaction();
    session.endSession();

    console.log("========== DATA PURCHASE SUCCESS ==========");
    console.log("Balance Before:", balanceBefore);
    console.log("Amount Paid   :", value);
    console.log("Balance After :", balanceAfter);
    console.log("===========================================");

    return {
      success: true,

      message:
        providerResult?.message ||
        "Data purchase successful",

      provider: providerName,

      providerResponse:
        providerResult?.data || providerResult,

      /*
       * IMPORTANT:
       * These values are used by the frontend
       * receipt.
       */
      walletBalance: balanceAfter,

      balanceBefore,
      amountPaid: value,
      balanceAfter,
    };
  } catch (error: any) {
    console.error(
      "BUY DATA SERVICE ERROR:",
      error?.message || error
    );

    /*
     * Unexpected error.
     *
     * If wallet was debited, refund it.
     */
    try {
      if (debited) {
        const refund = await creditWallet({
          userId,
          amount: value,
          session,
        });

        console.log("========== DATA ERROR REFUND ==========");
        console.log("Refund Amount :", value);
        console.log("Balance After :", refund.balanceAfter);
        console.log("=======================================");
      }

      await session.commitTransaction();
    } catch (rollbackError: any) {
      console.error(
        "Data buy rollback error:",
        rollbackError?.message || rollbackError
      );

      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch {
        // Ignore transaction cleanup error
      }
    }

    session.endSession();

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error?.message || "Data purchase failed",
      500
    );
  }
};