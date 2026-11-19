
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import AppError from "../utils/AppError";
import Provider from "../models/provider.model";
import Transaction from "../models/transaction.model";
import { getProvider } from "../providers";
import type { ProviderResponse, VTUProvider } from "../providers/provider.interface";
import { debitWallet, creditWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
import { createFinancialLedgerEntry } from "./financial-ledger.service";

const isTest = String(process.env.VTPASS_BASE_URL || "")
  .toLowerCase()
  .includes("sandbox");

interface PurchaseAirtimePayload {
  userId: string;
  network: string;
  phone: string;
  amount: number;
  batchReference?: string;
  requestId?: string;
}

const isDuplicateKeyError = (error: any): boolean =>
  error?.code === 11000;

const isValidRequestId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const generateVtpassRequestId = (): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const timestamp =
    `${getPart("year")}${getPart("month")}${getPart("day")}${getPart("hour")}${getPart("minute")}`;

  const randomPart = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");

  return `${timestamp}${randomPart}`;
};
const findExistingAirtimeRequest = async (
  idempotencyKey: string
): Promise<any | null> => {
  return Transaction.findOne({ idempotencyKey }).lean();
};

const validateExistingRequest = (
  existing: any,
  userId: string,
  network: string,
  phone: string,
  amount: number
) => {
  const metadata = existing.metadata || {};

  const sameRequest =
    String(existing.userId) === String(userId) &&
    existing.category === "AIRTIME" &&
    existing.type === "DEBIT" &&
    String(metadata.network || "").toLowerCase() ===
      network.toLowerCase() &&
    String(metadata.phone || "") === phone &&
    Number(existing.amount) === amount;

  if (!sameRequest) {
    throw new AppError(
      "This request ID has already been used for a different airtime purchase.",
      409
    );
  }
};

const returnExistingAirtimeRequest = (existing: any) => {
  const status = String(existing.status || "PENDING").toUpperCase();

  return {
    success: status === "SUCCESS",
    status,
    message:
      status === "SUCCESS"
        ? "This airtime purchase has already been completed."
        : status === "FAILED"
          ? "This airtime purchase has already failed. Check the transaction and refund record."
          : "This airtime purchase is still being processed. Please check the transaction status before trying again.",
    transaction: existing,
    balanceBefore: existing.balanceBefore,
    balanceAfter: existing.balanceAfter,
    walletBalance: existing.balanceAfter,
    provider: existing.metadata?.provider,
    providerResponse: existing.metadata?.providerResponse,
    duplicateRequest: true,
  };
};


// =====================================================
// RECONCILE AN EXISTING PENDING AIRTIME REQUEST
// This function only checks the original provider request.
// It never submits another airtime purchase.
// =====================================================

const reconcileExistingAirtimeRequest = async (
  existing: any
): Promise<any> => {
  const existingStatus = String(
    existing.status || "PENDING"
  ).toUpperCase();

  if (existingStatus !== "PENDING") {
    return returnExistingAirtimeRequest(existing);
  }

  const metadata = existing.metadata || {};
  const providerName = String(
    metadata.provider || ""
  ).toLowerCase();

  const providerRequestId = String(
    metadata.providerRequestId ||
    metadata.providerResponse?.request_id ||
    ""
  );

  if (!providerName || !providerRequestId) {
    return returnExistingAirtimeRequest(existing);
  }

  const selectedProvider = getProvider(providerName);

  if (
    !selectedProvider ||
    typeof selectedProvider.checkTransactionStatus !== "function"
  ) {
    return returnExistingAirtimeRequest(existing);
  }

  let providerResponse: ProviderResponse;

  try {
    providerResponse =
      await selectedProvider.checkTransactionStatus(
        providerRequestId
      );
  } catch (error: any) {
    console.error(
      "Existing airtime status check failed:",
      error
    );

    providerResponse = {
      success: false,
      status: "UNCERTAIN",
      uncertain: true,
      message:
        "Provider status could not be confirmed.",
      provider: providerName,
      request_id: providerRequestId,
    };
  }

  const providerStatus = String(
    providerResponse.status || ""
  ).toUpperCase();

  const providerTransactionStatus = String(
    providerResponse.providerStatus || ""
  ).toUpperCase();

  const isPending =
    providerResponse.uncertain === true ||
    providerStatus === "PENDING" ||
    providerStatus === "UNCERTAIN" ||
    [
      "PENDING",
      "PROCESSING",
      "INITIATED",
      "SUBMITTED",
      "IN_PROGRESS",
    ].includes(providerTransactionStatus);

  const isConfirmedSuccess =
    !isPending && providerStatus === "SUCCESS";

  const isConfirmedFailure =
    !isPending && providerStatus === "FAILED";

  const latestResponse = async (): Promise<any> => {
    const latest = await Transaction.findById(
      existing._id
    ).lean();

    if (!latest) {
      return returnExistingAirtimeRequest(existing);
    }

    const result: any =
      returnExistingAirtimeRequest(latest);

    if (
      String(latest.status).toUpperCase() === "FAILED" &&
      latest.metadata?.refundBalanceAfter !== undefined
    ) {
      result.balanceAfter =
        latest.metadata.refundBalanceAfter;
      result.walletBalance =
        latest.metadata.refundBalanceAfter;
    }

    return result;
  };

  // Unknown, pending or ambiguous responses never cause refunds.
  if (!isConfirmedSuccess && !isConfirmedFailure) {
    await Transaction.findOneAndUpdate(
      {
        _id: existing._id,
        status: "PENDING",
      },
      {
        $set: {
          "metadata.providerResponse": providerResponse,
          "metadata.lastStatusCheckAt": new Date(),
          "metadata.requiresStatusVerification": true,
        },
      },
      { new: true }
    );

    return latestResponse();
  }

  const userId = String(existing.userId);
  const amount = Number(existing.amount);
  const network = String(metadata.network || "airtime")
    .toUpperCase();
  const phone = String(metadata.phone || "");
  const isTestTransaction =
    metadata.isTest === true;
  const batchReference = metadata.batchReference;

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !userId
  ) {
    throw new AppError(
      "Pending airtime transaction has invalid reconciliation details.",
      500
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (isConfirmedSuccess) {
        const successfulTransaction =
          await Transaction.findOneAndUpdate(
            {
              _id: existing._id,
              status: "PENDING",
            },
            {
              $set: {
                status: "SUCCESS",
                "metadata.providerResponse": providerResponse,
                "metadata.purchaseStatus": "SUCCESS",
                "metadata.requiresStatusVerification": false,
                "metadata.lastStatusCheckAt": new Date(),
              },
            },
            {
              new: true,
              session,
            }
          );

        // Another reconciliation already finalised this transaction.
        if (!successfulTransaction) {
          return;
        }

        const providerCost = Number(
          providerResponse.providerCost
        );

        const providerCostKnown =
          Number.isFinite(providerCost) &&
          providerCost >= 0;

        await createFinancialLedgerEntry({
          type: "REVENUE",
          category: "AIRTIME_SALE",
          amount,
          customerAmount: amount,
          providerCost: providerCostKnown
            ? providerCost
            : undefined,
          grossProfit: providerCostKnown
            ? amount - providerCost
            : undefined,
          provider: providerName,
          service: "AIRTIME",
          user: userId,
          transaction: successfulTransaction._id,
          reference: `AIRTIME-SALE-${successfulTransaction._id}`,
          description: `${network} Airtime Sale`,
          metadata: {
            network: metadata.network,
            phone,
            providerCostKnown,
            isTest: isTestTransaction,
            batchReference,
            reconciled: true,
          },
          session,
        });
      }

      if (isConfirmedFailure) {
        const failedTransaction =
          await Transaction.findOneAndUpdate(
            {
              _id: existing._id,
              status: "PENDING",
              "metadata.refundProcessed": {
                $ne: true,
              },
            },
            {
              $set: {
                status: "FAILED",
                "metadata.providerResponse": providerResponse,
                "metadata.purchaseStatus": "FAILED",
                "metadata.refundProcessed": true,
                "metadata.refundAmount": amount,
                "metadata.refundedAt": new Date(),
                "metadata.requiresStatusVerification": false,
                "metadata.lastStatusCheckAt": new Date(),
              },
            },
            {
              new: true,
              session,
            }
          );

        // Only the process that successfully changes PENDING
        // to FAILED is allowed to issue the refund.
        if (!failedTransaction) {
          return;
        }

        const refundResult = await creditWallet({
          userId,
          amount,
          session,
        });

        await Transaction.updateOne(
          { _id: failedTransaction._id },
          {
            $set: {
              "metadata.refundBalanceAfter":
                refundResult.balanceAfter,
            },
          },
          { session }
        );

        await createTransaction({
          userId,
          type: "CREDIT",
          category: "REFUND",
          amount,
          status: "SUCCESS",
          description: `${network} Airtime Purchase Refund`,
          idempotencyKey:
            `AIRTIME-REFUND-${failedTransaction._id}`,
          balanceBefore: refundResult.balanceBefore,
          balanceAfter: refundResult.balanceAfter,
          metadata: {
            network: metadata.network,
            phone,
            provider: providerName,
            originalTransactionId: String(
              failedTransaction._id
            ),
            refundProcessed: true,
            reconciled: true,
            isTest: isTestTransaction,
            batchReference,
          },
          session,
        });

        await createFinancialLedgerEntry({
          type: "EXPENSE",
          category: "REFUND",
          amount,
          provider: providerName,
          service: "AIRTIME",
          user: userId,
          transaction: failedTransaction._id,
          reference:
            `AIRTIME-REFUND-${failedTransaction._id}`,
          description: `${network} Airtime Purchase Refund`,
          metadata: {
            originalTransaction:
              failedTransaction.reference,
            refundProcessed: true,
            reconciled: true,
            isTest: isTestTransaction,
            batchReference,
          },
          session,
        });
      }
    });
  } finally {
    await session.endSession();
  }

  return latestResponse();
};
export const purchaseAirtime = async ({
  userId,
  network,
  phone,
  amount,
  batchReference,
  requestId,
}: PurchaseAirtimePayload) => {
  if (!userId || !network || !phone || !amount || amount <= 0) {
    throw new AppError(
      "User, network, phone and a valid airtime amount are required.",
      400
    );
  }

  const normalizedNetwork = network.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  const normalizedRequestId = requestId || randomUUID();

  if (!isValidRequestId(normalizedRequestId)) {
    throw new AppError(
      "A valid UUID request ID is required for airtime purchases.",
      400
    );
  }

  const idempotencyKey =
    `AIRTIME-${userId}-${normalizedRequestId}`;

  console.log("\n======================================");
  console.log("AIRTIME PURCHASE STARTED");
  console.log("User ID  :", userId);
  console.log("Network  :", normalizedNetwork);
  console.log("Phone    :", normalizedPhone);
  console.log("Amount   :", amount);
  console.log("Request  :", normalizedRequestId);
  console.log("======================================\n");

  // =====================================================
  // 1. CHECK FOR AN EXISTING REQUEST
  // =====================================================

  const existingRequest = await findExistingAirtimeRequest(
    idempotencyKey
  );

  if (existingRequest) {
    validateExistingRequest(
      existingRequest,
      userId,
      normalizedNetwork,
      normalizedPhone,
      amount
    );

    console.log(
      "Existing airtime request found. No new debit or provider call."
    );

    return await reconcileExistingAirtimeRequest(existingRequest);
  }

  // =====================================================
  // 2. FIND THE ADMIN-SELECTED ACTIVE AIRTIME PROVIDER
  // =====================================================

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

  const selectedProvider = getProvider(provider) as VTUProvider;

  const providerRequestId =
    provider === "vtpass" ? generateVtpassRequestId() : undefined;

  if (!selectedProvider) {
    throw new AppError(
      "The active Airtime provider integration is unavailable.",
      503
    );
  }

  // =====================================================
  // 3. DEBIT WALLET AND CREATE PENDING TRANSACTION
  //
  // Provider request is deliberately outside this
  // MongoDB transaction.
  // =====================================================

  let purchaseTransaction: any;
  let walletResult: any;

  const debitSession = await mongoose.startSession();

  try {
    await debitSession.withTransaction(async () => {
      walletResult = await debitWallet({
        userId,
        amount,
        session: debitSession,
      });

      purchaseTransaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "AIRTIME",
        amount,
        status: "PENDING",
        description: `${normalizedNetwork.toUpperCase()} Airtime Purchase Pending`,
        idempotencyKey,
        balanceBefore: walletResult.balanceBefore,
        balanceAfter: walletResult.balanceAfter,
        metadata: {
          network: normalizedNetwork,
          phone: normalizedPhone,
          provider,
          providerRequestId,
          requestId: normalizedRequestId,
          purchaseStatus: "PENDING",
          refundProcessed: false,
          isTest,
          batchReference,
        },
        session: debitSession,
      });
    });
  } catch (error: any) {
    if (isDuplicateKeyError(error)) {
      const winningRequest = await findExistingAirtimeRequest(
        idempotencyKey
      );

      if (winningRequest) {
        validateExistingRequest(
          winningRequest,
          userId,
          normalizedNetwork,
          normalizedPhone,
          amount
        );

        return returnExistingAirtimeRequest(winningRequest);
      }
    }

    throw error;
  } finally {
    await debitSession.endSession();
  }

  console.log("Airtime wallet debit completed.");
  console.log("Balance Before:", walletResult.balanceBefore);
  console.log("Balance After :", walletResult.balanceAfter);
  console.log(
    "Pending transaction created:",
    purchaseTransaction._id
  );

  // =====================================================
  // 4. CALL PROVIDER ONCE, OUTSIDE THE TRANSACTION
  // =====================================================

  let providerResponse: ProviderResponse;

  try {
    providerResponse = await selectedProvider.buyAirtime({
      network: normalizedNetwork,
      phone: normalizedPhone,
      amount,
      provider,
      requestId: providerRequestId,
    });
  } catch (error: any) {
    console.error(
      "Airtime provider request threw an error:",
      error
    );

    providerResponse = {
      success: false,
      status: "UNCERTAIN",
      uncertain: true,
      retryable: false,
      message:
        error?.message ||
        "Provider response could not be confirmed. Transaction requires status verification.",
      provider,
    };
  }

  console.log("========== PROVIDER AIRTIME RESPONSE ==========");
  console.log(JSON.stringify(providerResponse, null, 2));
  console.log("===============================================");

  // =====================================================
  // 5. CLASSIFY PROVIDER RESPONSE
  // =====================================================

  const providerStatus = String(
    providerResponse.status || ""
  ).toUpperCase();

  const providerTransactionStatus = String(
    providerResponse.providerStatus || ""
  ).toUpperCase();

  const isPending =
    providerResponse.uncertain === true ||
    providerStatus === "PENDING" ||
    providerStatus === "UNCERTAIN" ||
    providerTransactionStatus === "PENDING" ||
    providerTransactionStatus === "PROCESSING";

  const isConfirmedSuccess =
    !isPending &&
    providerStatus !== "FAILED" &&
    providerResponse.success === true;

  const isConfirmedFailure =
    !isPending &&
    !isConfirmedSuccess &&
    (
      providerStatus === "FAILED"
    );

  // =====================================================
  // 6. PENDING OR UNCERTAIN
  //
  // Keep the debit and pending transaction.
  // Never automatically refund an uncertain purchase.
  // =====================================================

  if (
    isPending ||
    (!isConfirmedSuccess && !isConfirmedFailure)
  ) {
const updatedTransaction =
  await Transaction.findOneAndUpdate(
    {
      _id: purchaseTransaction._id,
      status: "PENDING",
      "metadata.refundProcessed": { $ne: true },
    },
    {
      $set: {
        status: "PENDING",
        metadata: {
          network: normalizedNetwork,
          phone: normalizedPhone,
          provider,
          providerRequestId,
          requestId: normalizedRequestId,
          providerResponse,
          purchaseStatus: "PENDING",
          refundProcessed: false,
          requiresStatusVerification: true,
          isTest,
          batchReference,
        },
      },
    },
    { new: true }
  );

if (!updatedTransaction) {
  const latestTransaction = await Transaction.findById(
    purchaseTransaction._id
  ).lean();

  if (!latestTransaction) {
    throw new AppError(
      "The airtime transaction could not be retrieved.",
      500
    );
  }

  return returnExistingAirtimeRequest(latestTransaction);
}
    console.warn(
      "Airtime purchase is pending or uncertain. No refund issued."
    );

    return {
      success: false,
      status: "PENDING",
      message:
        "Your airtime purchase is being verified. Your wallet has not been refunded because the provider result is not yet confirmed. Please do not purchase again using a new request.",
      transaction: updatedTransaction || purchaseTransaction,
      balanceBefore: walletResult.balanceBefore,
      balanceAfter: walletResult.balanceAfter,
      walletBalance: walletResult.balanceAfter,
      provider,
      providerResponse,
      requestId: normalizedRequestId,
    };
  }

  // =====================================================
  // 7. CONFIRMED SUCCESS
  // =====================================================

   // =====================================================
  // 7. CONFIRMED SUCCESS
  // =====================================================

  if (isConfirmedSuccess) {
    const successSession = await mongoose.startSession();

    try {
      let successfulTransaction: any;

      await successSession.withTransaction(async () => {
        successfulTransaction =
          await Transaction.findOneAndUpdate(
            {
              _id: purchaseTransaction._id,
              status: "PENDING",
              "metadata.refundProcessed": { $ne: true },
            },
            {
              $set: {
                status: "SUCCESS",
                metadata: {
                  network: normalizedNetwork,
                  phone: normalizedPhone,
                  provider,
                  providerRequestId,
                  requestId: normalizedRequestId,
                  providerResponse,
                  purchaseStatus: "SUCCESS",
                  refundProcessed: false,
                  isTest,
                  batchReference,
                  balanceBefore: walletResult.balanceBefore,
                  balanceAfter: walletResult.balanceAfter,
                },
              },
            },
            {
              new: true,
              session: successSession,
            }
          );

        // Another request has already finalised this transaction.
        // Do not create another revenue ledger entry.
        if (!successfulTransaction) {
          return;
        }

        const providerCost = Number(
          providerResponse.providerCost
        );

        const providerCostKnown =
          Number.isFinite(providerCost) &&
          providerCost >= 0;

        const grossProfit = providerCostKnown
          ? amount - providerCost
          : undefined;

        await createFinancialLedgerEntry({
          type: "REVENUE",
          category: "AIRTIME_SALE",
          amount,
          customerAmount: amount,
          providerCost: providerCostKnown
            ? providerCost
            : undefined,
          grossProfit,
          provider,
          service: "AIRTIME",
          user: userId,
          transaction: successfulTransaction._id,
          reference: `AIRTIME-SALE-${successfulTransaction._id}`,
          description: `${normalizedNetwork.toUpperCase()} Airtime Sale`,
          metadata: {
            network: normalizedNetwork,
            phone: normalizedPhone,
            providerCostKnown,
            isTest,
            batchReference,
          },
          session: successSession,
        });
      });

      // If another request already finalised the transaction,
      // return its recorded result without duplicating the ledger.
      if (!successfulTransaction) {
        const latestTransaction = await Transaction.findById(
          purchaseTransaction._id
        ).lean();

        if (!latestTransaction) {
          throw new AppError(
            "The airtime transaction could not be retrieved after processing.",
            500
          );
        }

        return returnExistingAirtimeRequest(latestTransaction);
      }

      console.log("Airtime purchase successful.");
      console.log("Financial ledger entry saved.");

      return {
        success: true,
        status: "SUCCESS",
        message: "Airtime purchase successful",
        balanceBefore: walletResult.balanceBefore,
        balanceAfter: walletResult.balanceAfter,
        walletBalance: walletResult.balanceAfter,
        transaction: successfulTransaction,
        provider,
        providerResponse,
        requestId: normalizedRequestId,
      };
    } finally {
      await successSession.endSession();
    }
  }


  // =====================================================
  // 8. CONFIRMED PROVIDER FAILURE
  //
  // Refund only after a confirmed failure.
  // =====================================================

    if (isConfirmedFailure) {
    const refundSession = await mongoose.startSession();
    let refundCompleted = false;

    try {
      await refundSession.withTransaction(async () => {
        // Reset on every transaction callback attempt.
        refundCompleted = false;

        // Only one request can claim this pending transaction
        // and proceed with the refund.
        const failedTransaction =
          await Transaction.findOneAndUpdate(
            {
              _id: purchaseTransaction._id,
              status: "PENDING",
              "metadata.refundProcessed": { $ne: true },
            },
            {
              $set: {
                status: "FAILED",
                metadata: {
                  network: normalizedNetwork,
                  phone: normalizedPhone,
                  provider,
                  providerRequestId,
                  requestId: normalizedRequestId,
                  providerResponse,
                  purchaseStatus: "FAILED",
                  refundProcessed: true,
                  refundAmount: amount,
                  refundedAt: new Date(),
                  isTest,
                  batchReference,
                },
              },
            },
            {
              new: true,
              session: refundSession,
            }
          );

        // Another request has already claimed or completed this refund.
        if (!failedTransaction) {
          return;
        }

        // Credit the wallet only after successfully claiming the refund.
        const refundResult = await creditWallet({
          userId,
          amount,
          session: refundSession,
        });

        const updatedFailedTransaction =
          await Transaction.findByIdAndUpdate(
            failedTransaction._id,
            {
              $set: {
                "metadata.refundBalanceAfter":
                  refundResult.balanceAfter,
              },
            },
            {
              new: true,
              session: refundSession,
            }
          );

        if (!updatedFailedTransaction) {
          throw new AppError(
            "The refunded airtime transaction could not be updated.",
            500
          );
        }

        // Record the wallet refund.
        await createTransaction({
          userId,
          type: "CREDIT",
          category: "REFUND",
          amount,
          status: "SUCCESS",
          description: `${normalizedNetwork.toUpperCase()} Airtime Purchase Refund`,
          idempotencyKey: `AIRTIME-REFUND-${failedTransaction._id}`,
          balanceBefore: refundResult.balanceBefore,
          balanceAfter: refundResult.balanceAfter,
          metadata: {
            network: normalizedNetwork,
            phone: normalizedPhone,
            provider,
            originalTransaction: failedTransaction.reference,
            originalTransactionId: String(
              failedTransaction._id
            ),
            refundProcessed: true,
            isTest,
            batchReference,
          },
          session: refundSession,
        });

        // Record the refund in the financial ledger.
        await createFinancialLedgerEntry({
          type: "EXPENSE",
          category: "REFUND",
          amount,
          provider,
          service: "AIRTIME",
          user: userId,
          transaction: failedTransaction._id,
          reference: `AIRTIME-REFUND-${failedTransaction._id}`,
          description: `${normalizedNetwork.toUpperCase()} Airtime Purchase Refund`,
          metadata: {
            originalTransaction: failedTransaction.reference,
            refundProcessed: true,
            isTest,
            batchReference,
          },
          session: refundSession,
        });

        refundCompleted = true;
      });
    } finally {
      await refundSession.endSession();
    }

    // If another request already processed the refund,
    // return the existing transaction without issuing another credit.
    if (!refundCompleted) {
      const latestTransaction = await Transaction.findById(
        purchaseTransaction._id
      ).lean();

      if (!latestTransaction) {
        throw new AppError(
          "The airtime transaction could not be retrieved after refund processing.",
          500
        );
      }

      const existingResult: any =
        returnExistingAirtimeRequest(latestTransaction);

      const recordedRefundBalance =
        latestTransaction.metadata?.refundBalanceAfter;

      if (
        recordedRefundBalance !== undefined &&
        recordedRefundBalance !== null
      ) {
        existingResult.balanceAfter =
          Number(recordedRefundBalance);

        existingResult.walletBalance =
          Number(recordedRefundBalance);
      }

      return existingResult;
    }

    console.log("Confirmed airtime failure.");
    console.log(
      "Wallet refund and refund ledger entry completed."
    );

    throw new AppError(
      providerResponse.message ||
        "Airtime purchase failed. Your wallet has been refunded.",
      400
    );
  }


  throw new AppError(
    "Airtime purchase could not be classified. Please check the transaction status.",
    500
  );
};