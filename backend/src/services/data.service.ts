import mongoose from "mongoose";
import AppError from "../utils/apperror";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
import {
  createFinancialLedgerEntry,
} from "./financial-ledger.service";

import {
  dataMarginConfig,
  calculateProviderCost,
} from "../config/service-margin.config";

interface PurchaseDataPayload {
  userId: string;
  network: string;
  phone: string;
  plan: string;
  amount: number;
}

export const purchaseData = async ({
  userId,
  network,
  phone,
  plan,
  amount,
}: PurchaseDataPayload) => {
  // ==========================================
  // VALIDATION
  // ==========================================

  if (!userId) {
    throw new AppError(
      "User ID is required",
      400
    );
  }

  if (!network || !phone || !plan) {
    throw new AppError(
      "Network, phone and plan are required",
      400
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new AppError(
      "Invalid data amount",
      400
    );
  }

  const normalizedNetwork =
    network.toLowerCase();

  const marginConfig =
    dataMarginConfig[normalizedNetwork];

  if (!marginConfig) {
    throw new AppError(
      `Unsupported network: ${network}`,
      400
    );
  }

  // ==========================================
  // CALCULATE PROVIDER COST / PROFIT
  // ==========================================
  //
  // Currently marginPercent is null because
  // we don't yet have your actual live VTpass
  // merchant pricing.
  //
  // We therefore do NOT invent a provider cost
  // or profit.
  // ==========================================

  const marginCalculation =
    calculateProviderCost(
      amount,
      marginConfig.marginPercent
    );

  const providerCost =
    marginCalculation?.providerCost ??
    undefined;

  const grossProfit =
    marginCalculation?.grossProfit ??
    undefined;

  const session =
    await mongoose.startSession();

  try {
    let response: any;

    console.log(
      "\n======================================"
    );

    console.log(
      "DATA PURCHASE STARTED"
    );

    console.log(
      "User ID :",
      userId
    );

    console.log(
      "Network :",
      normalizedNetwork
    );

    console.log(
      "Phone   :",
      phone
    );

    console.log(
      "Plan    :",
      plan
    );

    console.log(
      "Amount  :",
      amount
    );

    console.log(
      "Provider:",
      marginConfig.provider
    );

    console.log(
      "Margin %:",
      marginConfig.marginPercent ??
        "Not configured"
    );

    console.log(
      "Provider Cost:",
      providerCost ??
        "Not available"
    );

    console.log(
      "Gross Profit:",
      grossProfit ??
        "Not available"
    );

    console.log(
      "======================================\n"
    );

    await session.withTransaction(
      async () => {

        // ======================================
        // 1. DEBIT WALLET
        // ======================================

        const debitResult =
          await debitWallet({
            userId,
            amount,
            session,
          });

        const balanceBefore =
          debitResult.balanceBefore;

        const balanceAfter =
          debitResult.balanceAfter;

        console.log(
          "========== WALLET BALANCE =========="
        );

        console.log(
          "Balance Before :",
          balanceBefore
        );

        console.log(
          "Amount Debited :",
          amount
        );

        console.log(
          "Balance After  :",
          balanceAfter
        );

        console.log(
          "===================================="
        );

        console.log(
          "✅ Wallet debited successfully"
        );

        // ======================================
        // 2. CALL VTPASS
        // ======================================

        const providerResponse =
          await vtpassProvider.buyData({
            network:
              normalizedNetwork,

            phone:
              phone.trim(),

            plan,

            amount,
          });

        console.log(
          "========== VTPASS DATA RESPONSE =========="
        );

        console.log(
          JSON.stringify(
            providerResponse,
            null,
            2
          )
        );

        console.log(
          "=========================================="
        );

        // ======================================
        // 3. VTPASS FAILED
        // ======================================

        if (
          !providerResponse ||
          !providerResponse.success
        ) {
          console.log(
            "❌ VTpass data purchase failed"
          );

          throw new AppError(
            providerResponse?.message ||
              "Data purchase failed",
            400
          );
        }

        console.log(
          "✅ VTpass data purchase successful"
        );

        // ======================================
        // 4. CREATE CUSTOMER TRANSACTION
        // ======================================

        const transaction =
          await createTransaction({
            userId,

            type: "DEBIT",

            category: "DATA",

            amount,

            status: "SUCCESS",

            description:
              `${normalizedNetwork.toUpperCase()} Data Purchase`,

            balanceBefore,

            balanceAfter,

            metadata: {
              network:
                normalizedNetwork,

              phone,

              plan,

              provider:
                marginConfig.provider,

              customerAmount:
                amount,

              providerCost:
                providerCost ?? null,

              grossProfit:
                grossProfit ?? null,

              providerMarginPercent:
                marginConfig.marginPercent,

              providerResponse,
            },

            session,
          });

        console.log(
          "========== DATA TRANSACTION =========="
        );

        console.log(
          "Transaction Reference :",
          transaction.reference
        );

        console.log(
          "Transaction ID        :",
          transaction._id
        );

        console.log(
          "Balance Before        :",
          transaction.balanceBefore
        );

        console.log(
          "Amount                :",
          transaction.amount
        );

        console.log(
          "Balance After         :",
          transaction.balanceAfter
        );

        console.log(
          "======================================"
        );

        console.log(
          "✅ Customer transaction saved"
        );

        // ======================================
        // 5. CREATE FINANCIAL LEDGER
        // ======================================

        const ledgerEntry =
          await createFinancialLedgerEntry({
            type: "REVENUE",

            category:
              "DATA_SALE",

            /**
             * Amount paid by customer.
             */
            amount,

            customerAmount:
              amount,

            /**
             * Actual provider cost when
             * margin is configured.
             */
            providerCost,

            /**
             * Actual AbuPay gross profit
             * when margin is configured.
             */
            grossProfit,

            provider:
              marginConfig.provider,

            service:
              `${normalizedNetwork.toUpperCase()} Data`,

            user:
              userId,

            transaction:
              transaction._id,

            reference:
              `DATA-SALE-${transaction.reference}`,

            description:
              `${normalizedNetwork.toUpperCase()} Data Sale`,

            metadata: {
              network:
                normalizedNetwork,

              phone,

              plan,

              customerAmount:
                amount,

              provider:
                marginConfig.provider,

              providerCost:
                providerCost ?? null,

              grossProfit:
                grossProfit ?? null,

              marginPercent:
                marginConfig.marginPercent,

              customerTransactionReference:
                transaction.reference,

              providerResponse,
            },

            session,
          });

        console.log(
          "========== FINANCIAL LEDGER =========="
        );

        console.log(
          "Ledger Reference:",
          ledgerEntry.reference
        );

        console.log(
          "Category:",
          ledgerEntry.category
        );

        console.log(
          "Customer Amount:",
          ledgerEntry.customerAmount
        );

        console.log(
          "Provider:",
          ledgerEntry.provider
        );

        console.log(
          "Provider Cost:",
          ledgerEntry.providerCost ??
            "Not available"
        );

        console.log(
          "Gross Profit:",
          ledgerEntry.grossProfit ??
            "Not available"
        );

        console.log(
          "======================================"
        );

        console.log(
          "✅ Financial ledger saved"
        );

        // ======================================
        // 6. RESPONSE
        // ======================================

        response = {
          success: true,

          message:
            "Data purchase successful",

          walletBalance:
            balanceAfter,

          balanceBefore,

          balanceAfter,

          transaction,

          ledgerEntry,

          providerResponse,

          financial: {
            customerAmount:
              amount,

            providerCost:
              providerCost ?? null,

            grossProfit:
              grossProfit ?? null,

            marginPercent:
              marginConfig.marginPercent,

            provider:
              marginConfig.provider,
          },
        };
      }
    );

    // ==========================================
    // 7. VERIFY TRANSACTION COMPLETED
    // ==========================================

    if (!response) {
      throw new AppError(
        "Data purchase failed",
        500
      );
    }

    console.log(
      "✅ DATA PURCHASE COMPLETED"
    );

    return response;

  } catch (error: any) {

    console.error(
      "\n======================================"
    );

    console.error(
      "DATA PURCHASE ERROR"
    );

    console.error(error);

    console.error(
      "======================================\n"
    );

    throw error;

  } finally {

    await session.endSession();

    console.log(
      "========== DATA PURCHASE ENDED ==========\n"
    );
  }
};