import mongoose from "mongoose";
import AppError from "../utils/AppError";
import { getProvider } from "../providers";
import DataPlan from "../models/dataPlan.model";
import ProviderPlan from "../models/providerPlan.model";
import { debitWallet, creditWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
import { createFinancialLedgerEntry } from "./financial-ledger.service";

type BuyDataInput = {
  userId: string;
  network: string;
  phone: string;
  plan: string;
  amount?: number;
  provider?: string;
};

export const buyData = async ({
  userId,
  network,
  phone,
  plan,
}: BuyDataInput) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!network || !phone || !plan) {
    throw new AppError(
      "network, phone and plan are required",
      400
    );
  }

  const normalizedNetwork = network.toLowerCase().trim();

  /*
   * `plan` is now the AbuPay DataPlan ID.
   *
   * Customer does NOT choose:
   * - provider
   * - provider plan code
   * - selling price
   * - provider buying cost
   */
  const savedDataPlan = await DataPlan.findOne({
    _id: plan,
    network: {
      $regex: "^" + normalizedNetwork + "$",
      $options: "i",
    },
    active: true,
  })
    .populate("provider")
    .populate("providerPlan");

  if (!savedDataPlan) {
    throw new AppError(
      "This AbuPay data plan is not available.",
      409
    );
  }

  const providerRecord: any = savedDataPlan.provider;
  const providerPlan: any = savedDataPlan.providerPlan;

  if (!providerRecord || !providerRecord.active) {
    throw new AppError(
      "The provider mapped to this plan is not available.",
      409
    );
  }

  if (!providerPlan || !providerPlan.active) {
    throw new AppError(
      "The provider plan mapped to this AbuPay plan is not available.",
      409
    );
  }

  const customerAmount = Number(savedDataPlan.amount);
  const providerAmount = Number(providerPlan.providerCost);
  const providerPlanCode = String(
    providerPlan.providerPlanCode || ""
  ).trim();

  if (
    !Number.isFinite(customerAmount) ||
    customerAmount <= 0
  ) {
    throw new AppError(
      "The saved AbuPay selling price is invalid.",
      409
    );
  }

  if (
    !Number.isFinite(providerAmount) ||
    providerAmount < 0
  ) {
    throw new AppError(
      "The saved provider buying cost is invalid.",
      409
    );
  }

  if (!providerPlanCode) {
    throw new AppError(
      "The mapped provider plan code is missing.",
      409
    );
  }

  const providerName = String(
    providerRecord.key || ""
  )
    .toLowerCase()
    .trim();

  const selectedProvider = getProvider(providerName);

  if (
    !selectedProvider ||
    typeof selectedProvider.buyData !== "function"
  ) {
    throw new AppError(
      "The mapped provider does not support data purchase.",
      409
    );
  }

  const session = await mongoose.startSession();

  try {
    let response: any = null;

    await session.withTransaction(async () => {
      const walletResult = await debitWallet({
        userId,
        amount: customerAmount,
        session,
      });

      console.log("\n======================================");
      console.log("DATA PURCHASE STARTED");
      console.log("User ID:", userId);
      console.log("Network:", normalizedNetwork);
      console.log("Phone:", phone);
      console.log("AbuPay Plan:", savedDataPlan.name);
      console.log("Selling Price:", customerAmount);
      console.log("Provider:", providerName);
      console.log("Provider Plan:", providerPlanCode);
      console.log("Provider Cost:", providerAmount);
      console.log("======================================\n");

      const providerResult =
        await selectedProvider.buyData({
          network: normalizedNetwork,
          phone: phone.trim(),
          plan: providerPlanCode,
          amount: providerAmount,
        });

      if (!providerResult?.success) {
        const refundResult = await creditWallet({
          userId,
          amount: customerAmount,
          session,
        });

        await createTransaction({
          userId,
          type: "CREDIT",
          category: "DATA",
          amount: customerAmount,
          status: "FAILED",
          description:
            `${normalizedNetwork.toUpperCase()} Data Refund`,
          metadata: {
            network: normalizedNetwork,
            phone,
            plan: String(savedDataPlan._id),
            planName: savedDataPlan.name,
            provider: providerName,
            providerPlanCode,
            providerResponse: providerResult,
            balanceBefore: walletResult.balanceAfter,
            balanceAfter: refundResult.balanceAfter,
          },
          session,
        });

        response = {
          success: false,
          message:
            providerResult?.message ||
            "Data purchase failed",
          balanceBefore: walletResult.balanceBefore,
          amountPaid: customerAmount,
          balanceAfter: refundResult.balanceAfter,
          walletBalance: refundResult.balanceAfter,
          providerResponse:
            (providerResult as any)?.data ||
            providerResult,
        };

        return;
      }

      const transaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "DATA",
        amount: customerAmount,
        status: "SUCCESS",
        description:
          `${normalizedNetwork.toUpperCase()} Data Purchase`,
        metadata: {
          network: normalizedNetwork,
          phone,
          plan: String(savedDataPlan._id),
          planName: savedDataPlan.name,
          provider: providerName,
          providerPlanCode,
          providerResponse: providerResult,
          balanceBefore: walletResult.balanceBefore,
          balanceAfter: walletResult.balanceAfter,
        },
        session,
      });

      const grossProfit =
        customerAmount - providerAmount;

      await createFinancialLedgerEntry({
        type: "REVENUE",
        category: "DATA_SALE",
        amount: customerAmount,
        customerAmount,
        providerCost: providerAmount,
        grossProfit,
        provider: providerName,
        service: "DATA",
        user: userId,
        transaction: transaction._id,
        reference: `DATA-SALE-${transaction._id}`,
        description:
          `${normalizedNetwork.toUpperCase()} Data Sale`,
        metadata: {
          network: normalizedNetwork,
          phone,
          dataPlan: String(savedDataPlan._id),
          providerPlanCode,
          providerCostKnown: true,
        },
        session,
      });

      response = {
        success: true,
        message:
          providerResult?.message ||
          "Data purchase successful",
        balanceBefore: walletResult.balanceBefore,
        amountPaid: customerAmount,
        balanceAfter: walletResult.balanceAfter,
        walletBalance: walletResult.balanceAfter,
        transaction,
        providerResponse:
          (providerResult as any)?.data ||
          providerResult,
      };
    });

    if (!response) {
      throw new AppError(
        "Data purchase failed",
        500
      );
    }

    return response;
  } catch (error: any) {
    console.error(
      "BUY DATA SERVICE ERROR:",
      error?.message || error
    );

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error?.message || "Data purchase failed",
      500
    );
  } finally {
    await session.endSession();
  }
};
