
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import AppError from "../utils/AppError";
import { getProvider } from "../providers";
import DataPlan from "../models/dataPlan.model";
import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";
import { createTransaction } from "./transaction.service";
import { createFinancialLedgerEntry } from "./financial-ledger.service";

type BuyDataInput = {
  userId: string;
  network: string;
  phone: string;
  plan: string;
  requestId: string;
  amount?: number;
  provider?: string;
  batchReference?: string;
};

type PurchaseOutcome = "SUCCESS" | "FAILED" | "PENDING";

const isDuplicateKeyError = (error: any): boolean => {
  return (
    error?.code === 11000 ||
    error?.cause?.code === 11000 ||
    error?.originalError?.code === 11000
  );
};

const getLatestWalletBalance = async (
  userId: string,
  fallback: number
): Promise<number> => {
  try {
    const wallet = await Wallet.findOne({ user: userId })
      .select("balance")
      .lean();

    if (wallet && Number.isFinite(Number(wallet.balance))) {
      return Number(wallet.balance);
    }
  } catch (error: any) {
    console.error(
      "DATA PURCHASE WALLET BALANCE READ ERROR:",
      error?.message || error
    );
  }

  return fallback;
};

/**
 * Returns an existing transaction only when it belongs to the same
 * user and represents the same Data purchase request.
 */
const findExistingDataRequest = async (
  idempotencyKey: string,
  userId: string,
  normalizedNetwork: string,
  normalizedPhone: string,
  plan: string
) => {
  const existingTransaction: any = await Transaction.findOne({
    idempotencyKey,
  }).lean();

  if (!existingTransaction) {
    return null;
  }

  const metadata = existingTransaction.metadata || {};

  const sameRequest =
    String(existingTransaction.user) === String(userId) &&
    existingTransaction.category === "DATA" &&
    existingTransaction.type === "DEBIT" &&
    String(metadata.network || "").toLowerCase() === normalizedNetwork &&
    String(metadata.phone || "").trim() === normalizedPhone &&
    String(metadata.plan || "") === String(plan);

  if (!sameRequest) {
    throw new AppError(
      "This purchase request ID has already been used for a different transaction. Please start a new purchase.",
      409
    );
  }

  return existingTransaction;
};

/**
 * Reuses the result of a previously initiated purchase.
 * It deliberately does not contact the provider or debit the wallet.
 */
const returnExistingDataRequest = async (
  existingTransaction: any,
  userId: string
) => {
  const metadata = existingTransaction.metadata || {};
  const status = String(existingTransaction.status || "PENDING")
    .toUpperCase() as PurchaseOutcome;

  const walletBalance = await getLatestWalletBalance(
    userId,
    Number(existingTransaction.balanceAfter || 0)
  );

  const balanceBefore = Number(existingTransaction.balanceBefore || 0);
  const amountPaid = Number(existingTransaction.amount || 0);

  const balanceAfter =
    status === "FAILED" && metadata.refundProcessed === true
      ? Number(metadata.refundBalanceAfter ?? walletBalance)
      : Number(existingTransaction.balanceAfter ?? walletBalance);

  const message =
    metadata.providerError ||
    metadata.providerMessage ||
    (status === "SUCCESS"
      ? "This data purchase has already been completed."
      : status === "FAILED"
        ? "This data purchase has already failed. The refund process has been completed."
        : "This data purchase is already being processed or is awaiting provider verification. Please do not repeat the purchase.");

  return {
    success: status === "SUCCESS",
    status,
    message,
    balanceBefore,
    amountPaid,
    balanceAfter,
    walletBalance,
    transaction: existingTransaction,
    providerResponse: metadata.providerResponse || null,
    alreadyProcessed: true,
  };
};

export const buyData = async ({
  userId,
  network,
  phone,
  plan,
  requestId,
  batchReference,
}: BuyDataInput) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!network || !phone || !plan) {
    throw new AppError("network, phone and plan are required", 400);
  }

  // The frontend generates UUIDs using crypto.randomUUID().
  if (
    !requestId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    throw new AppError(
      "A valid purchase request ID is required.",
      400
    );
  }

  const normalizedNetwork = network.toLowerCase().trim();
  const normalizedPhone = phone.trim();
  const normalizedRequestId = requestId.toLowerCase();

  // Stable per-user idempotency key.
  const idempotencyKey = `DATA-${userId}-${normalizedRequestId}`;

  /*
   * CHECK 1:
   * Look for an existing request before checking the current provider
   * configuration or attempting another wallet debit.
   *
   * This allows a previously initiated PENDING request to be recognised
   * even if the provider configuration changes afterwards.
   */
  const existingRequest = await findExistingDataRequest(
    idempotencyKey,
    userId,
    normalizedNetwork,
    normalizedPhone,
    String(plan)
  );

  if (existingRequest) {
    return returnExistingDataRequest(existingRequest, userId);
  }

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

  if (!providerRecord.activeForData) {
    throw new AppError(
      "This data plan is not available through the currently selected Data provider.",
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

  if (!Number.isFinite(customerAmount) || customerAmount <= 0) {
    throw new AppError(
      "The saved AbuPay selling price is invalid.",
      409
    );
  }

  if (!Number.isFinite(providerAmount) || providerAmount < 0) {
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

  if (customerAmount <= providerAmount) {
    throw new AppError(
      "This data plan is temporarily unavailable because its selling price must be higher than the provider cost. Please contact support.",
      409
    );
  }

  const providerName = String(providerRecord.key || "")
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

  let purchaseTransaction: any = null;
  let balanceBefore = 0;
  let balanceAfterDebit = 0;

  /*
   * STEP 1:
   * Debit the wallet and create a PENDING transaction atomically.
   *
   * The stable idempotency key is stored on the debit transaction.
   * The MongoDB unique index prevents two transactions with the same
   * key from being committed.
   */
  const debitSession = await mongoose.startSession();

  try {
    await debitSession.withTransaction(async () => {
      const walletBefore = await Wallet.findOneAndUpdate(
        {
          user: userId,
          balance: { $gte: customerAmount },
        },
        {
          $inc: { balance: -customerAmount },
        },
        {
          new: false,
          session: debitSession,
        }
      );

      if (!walletBefore) {
        const existingWallet = await Wallet.findOne({
          user: userId,
        }).session(debitSession);

        if (!existingWallet) {
          throw new AppError("Wallet not found", 404);
        }

        throw new AppError("Insufficient wallet balance", 400);
      }

      balanceBefore = Number(walletBefore.balance);
      balanceAfterDebit = balanceBefore - customerAmount;

      purchaseTransaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "DATA",
        amount: customerAmount,
        status: "PENDING",
        description:
          `${normalizedNetwork.toUpperCase()} Data Purchase`,
        idempotencyKey,
        balanceBefore,
        balanceAfter: balanceAfterDebit,
        metadata: {
          network: normalizedNetwork,
          phone: normalizedPhone,
          plan: String(savedDataPlan._id),
          planName: savedDataPlan.name,
          provider: providerName,
          providerPlanCode,
          providerCost: providerAmount,
          batchReference,
          requestId: normalizedRequestId,
          purchaseStatus: "PENDING",
          refundProcessed: false,
        },
        session: debitSession,
      });
    });
  } catch (error: any) {
    /*
     * A concurrent identical request may have committed first.
     * The losing transaction is aborted, including its wallet debit.
     * Retrieve the winning transaction and return its current status.
     */
    if (isDuplicateKeyError(error)) {
      const existingRequest = await findExistingDataRequest(
        idempotencyKey,
        userId,
        normalizedNetwork,
        normalizedPhone,
        String(plan)
      );

      if (existingRequest) {
        return returnExistingDataRequest(existingRequest, userId);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error("DATA WALLET DEBIT ERROR:", error?.message || error);

    throw new AppError(
      error?.message || "Unable to initiate data purchase",
      500
    );
  } finally {
    await debitSession.endSession();
  }

  /*
   * STEP 2:
   * Call the provider once, outside MongoDB's transaction callback.
   *
   * An exception is treated as uncertain because the provider may
   * have received and processed the request before the connection failed.
   */
  let providerResult: any = null;
  let providerCallError: string | null = null;

  console.log("\n======================================");
  console.log("DATA PROVIDER REQUEST");
  console.log("User ID:", userId);
  console.log("Network:", normalizedNetwork);
  console.log("Phone:", normalizedPhone);
  console.log("AbuPay Plan:", savedDataPlan.name);
  console.log("Selling Price:", customerAmount);
  console.log("Provider:", providerName);
  console.log("Provider Plan:", providerPlanCode);
  console.log("Provider Cost:", providerAmount);
  console.log("Internal Reference:", purchaseTransaction.reference);
  console.log("======================================\n");

  try {
    providerResult = await selectedProvider.buyData({
      network: normalizedNetwork,
      phone: normalizedPhone,
      plan: providerPlanCode,
      amount: providerAmount,
    });
  } catch (error: any) {
    providerCallError =
      error?.message || "Provider request could not be confirmed";

    console.error(
      "DATA PROVIDER REQUEST UNCERTAIN:",
      providerCallError
    );
  }

  /*
   * STEP 3:
   * Classify the actual purchase outcome.
   *
   * Explicit provider status takes precedence over the top-level
   * success flag. BigiSub must provide an explicit successful status.
   * For other existing providers, success:true without an explicit
   * status retains the established success behaviour.
   */
  const rawProviderStatus = String(
    providerResult?.data?.data?.status ??
      providerResult?.data?.status ??
      ""
  )
    .trim()
    .toUpperCase();

  const normalizedProviderStatus = String(
    providerResult?.status ?? ""
  )
    .trim()
    .toUpperCase();

  const explicitProviderStatus =
    rawProviderStatus || normalizedProviderStatus;

  const successfulProviderStatuses = [
    "SUCCESS",
    "SUCCESSFUL",
    "COMPLETED",
  ];

  const failedProviderStatuses = [
    "FAILED",
    "FAILURE",
    "REJECTED",
    "DECLINED",
  ];

  let outcome: PurchaseOutcome = "PENDING";

  if (successfulProviderStatuses.includes(explicitProviderStatus)) {
    outcome = "SUCCESS";
  } else if (failedProviderStatuses.includes(explicitProviderStatus)) {
    outcome = "FAILED";
  } else if (
    !explicitProviderStatus &&
    providerName !== "bigisub" &&
    providerResult?.success === true
  ) {
    outcome = "SUCCESS";
  }

  if (providerCallError) {
    outcome = "PENDING";
  }

  const providerReference =
    providerResult?.providerReference ||
    providerResult?.data?.data?.reference ||
    providerResult?.data?.reference ||
    null;

  const providerTransactionId =
    providerResult?.data?.data?.transaction_id ||
    providerResult?.data?.transaction_id ||
    null;

  const providerMessage =
    providerCallError ||
    providerResult?.message ||
    "The provider has not confirmed the purchase outcome.";

  const providerMetadata = {
    provider: providerName,
    providerStatus: explicitProviderStatus || "UNKNOWN",
    providerReference,
    providerTransactionId,
    providerResponse: providerResult,
    providerError: providerCallError,
    providerMessage,
    outcome,
    checkedAt: new Date(),
  };

  /*
   * STEP 4:
   * Finalise the existing transaction.
   *
   * SUCCESS: mark debit successful and create DATA_SALE ledger.
   * FAILED: mark debit failed, refund once and record the refund.
   * PENDING: retain debit as pending; do not refund or create revenue.
   */
  const finalSession = await mongoose.startSession();

  let finalStatus: PurchaseOutcome = "PENDING";
  let finalWalletBalance = balanceAfterDebit;
  let finalTransaction: any = purchaseTransaction;
  let finalizationError: string | null = null;

  try {
    await finalSession.withTransaction(async () => {
      // Reset local results in case MongoDB retries this callback.
      finalStatus = "PENDING";
      finalWalletBalance = balanceAfterDebit;
      finalTransaction = purchaseTransaction;

      const currentTransaction = await Transaction.findOne({
        _id: purchaseTransaction._id,
        status: "PENDING",
      }).session(finalSession);

      if (!currentTransaction) {
        const latestTransaction = await Transaction.findById(
          purchaseTransaction._id
        ).session(finalSession);

        if (latestTransaction) {
          finalTransaction = latestTransaction;
          finalStatus = latestTransaction.status;
          finalWalletBalance = balanceAfterDebit;
        }

        return;
      }

      const existingMetadata =
        currentTransaction.metadata &&
        typeof currentTransaction.metadata === "object"
          ? currentTransaction.metadata
          : {};

      if (outcome === "SUCCESS") {
        currentTransaction.status = "SUCCESS";
        currentTransaction.metadata = {
          ...existingMetadata,
          ...providerMetadata,
          purchaseStatus: "SUCCESS",
          refundProcessed: false,
        };

        await currentTransaction.save({
          session: finalSession,
        });

        const grossProfit = customerAmount - providerAmount;

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
          transaction: currentTransaction._id,
          reference: `DATA-SALE-${currentTransaction._id}`,
          description:
            `${normalizedNetwork.toUpperCase()} Data Sale`,
          metadata: {
            network: normalizedNetwork,
            phone: normalizedPhone,
            dataPlan: String(savedDataPlan._id),
            providerPlanCode,
            providerReference,
            providerTransactionId,
            providerCostKnown: true,
            batchReference,
          },
          session: finalSession,
        });

        finalStatus = "SUCCESS";
        finalTransaction = currentTransaction;
        finalWalletBalance = balanceAfterDebit;
        return;
      }

      if (outcome === "FAILED") {
        if (existingMetadata.refundProcessed === true) {
          currentTransaction.status = "FAILED";

          await currentTransaction.save({
            session: finalSession,
          });

          finalStatus = "FAILED";
          finalTransaction = currentTransaction;
          return;
        }

        const walletAfterRefund = await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: customerAmount },
          },
          {
            new: true,
            session: finalSession,
          }
        );

        if (!walletAfterRefund) {
          throw new Error(
            "Wallet could not be found while processing the data refund"
          );
        }

        finalWalletBalance = Number(walletAfterRefund.balance);

        currentTransaction.status = "FAILED";
        currentTransaction.metadata = {
          ...existingMetadata,
          ...providerMetadata,
          purchaseStatus: "FAILED",
          refundProcessed: true,
          refundAmount: customerAmount,
          refundedAt: new Date(),
          refundBalanceAfter: finalWalletBalance,
        };

        await currentTransaction.save({
          session: finalSession,
        });

        await createTransaction({
          userId,
          type: "CREDIT",
          category: "REFUND",
          amount: customerAmount,
          status: "SUCCESS",
          description:
            `${normalizedNetwork.toUpperCase()} Data Purchase Refund`,
          idempotencyKey: `DATA-REFUND-${currentTransaction._id}`,
          balanceBefore: finalWalletBalance - customerAmount,
          balanceAfter: finalWalletBalance,
          metadata: {
            network: normalizedNetwork,
            phone: normalizedPhone,
            plan: String(savedDataPlan._id),
            planName: savedDataPlan.name,
            provider: providerName,
            originalTransaction: currentTransaction.reference,
            providerReference,
            providerTransactionId,
            refundProcessed: true,
            batchReference,
          },
          session: finalSession,
        });

        await createFinancialLedgerEntry({
          type: "EXPENSE",
          category: "REFUND",
          amount: customerAmount,
          provider: providerName,
          service: "DATA",
          user: userId,
          transaction: currentTransaction._id,
          reference: `DATA-REFUND-${currentTransaction._id}`,
          description:
            `${normalizedNetwork.toUpperCase()} Data Purchase Refund`,
          metadata: {
            originalTransaction: currentTransaction.reference,
            providerReference,
            providerTransactionId,
            refundProcessed: true,
            batchReference,
          },
          session: finalSession,
        });

        finalStatus = "FAILED";
        finalTransaction = currentTransaction;
        return;
      }

      currentTransaction.status = "PENDING";
      currentTransaction.metadata = {
        ...existingMetadata,
        ...providerMetadata,
        purchaseStatus: "PENDING",
        refundProcessed: false,
      };

      await currentTransaction.save({
        session: finalSession,
      });

      finalStatus = "PENDING";
      finalTransaction = currentTransaction;
      finalWalletBalance = balanceAfterDebit;
    });
  } catch (error: any) {
    finalizationError =
      error?.message || "Purchase outcome could not be saved";

    console.error(
      "DATA PURCHASE FINALIZATION ERROR:",
      finalizationError
    );

    /*
     * The provider may already have processed the request.
     * Keep the original debit pending rather than risk an incorrect refund.
     */
    finalStatus = "PENDING";
    finalWalletBalance = balanceAfterDebit;
    finalTransaction = purchaseTransaction;
  } finally {
    await finalSession.endSession();
  }

  const responseWalletBalance = await getLatestWalletBalance(
    userId,
    finalWalletBalance
  );

  if (String(finalStatus) === "SUCCESS") {
    return {
      success: true,
      status: "SUCCESS",
      message: providerMessage,
      balanceBefore,
      amountPaid: customerAmount,
      balanceAfter: balanceAfterDebit,
      walletBalance: responseWalletBalance,
      transaction: finalTransaction,
      providerResponse: providerResult?.data || providerResult,
    };
  }

  if (String(finalStatus) === "FAILED") {
    return {
      success: false,
      status: "FAILED",
      message: providerMessage,
      balanceBefore,
      amountPaid: customerAmount,
      balanceAfter: finalWalletBalance,
      walletBalance: responseWalletBalance,
      transaction: finalTransaction,
      providerResponse: providerResult?.data || providerResult,
    };
  }

  return {
    success: false,
    status: "PENDING",
    message: finalizationError
      ? "The provider outcome could not be safely confirmed or saved. Your transaction is pending verification. Please do not make another purchase for the same request."
      : "Your data purchase is awaiting provider confirmation. Your wallet debit has been retained pending verification. Please do not repeat the purchase.",
    balanceBefore,
    amountPaid: customerAmount,
    balanceAfter: balanceAfterDebit,
    walletBalance: responseWalletBalance,
    transaction: finalTransaction,
    providerResponse: providerResult?.data || providerResult,
  };
};
