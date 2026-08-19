import mongoose from "mongoose";
import AppError from "../utils/apperror";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
import {
  createFinancialLedgerEntry,
} from "./financial-ledger.service";

import {
  airtimeMarginConfig,
  calculateProviderCost,
} from "../config/service-margin.config";

interface PurchaseAirtimePayload {
  userId: string;
  network: string;
  phone: string;
  amount: number;
}

export const purchaseAirtime = async ({
  userId,
  network,
  phone,
  amount,
}: PurchaseAirtimePayload) => {
  // ==========================================
  // VALIDATION
  // ==========================================

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  if (!network) {
    throw new AppError("Network is required", 400);
  }

  if (!phone) {
    throw new AppError("Phone number is required", 400);
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new AppError(
      "Invalid airtime amount",
      400
    );
  }

  const normalizedNetwork =
    network.toLowerCase();

  const marginConfig =
    airtimeMarginConfig[normalizedNetwork];

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
  // At the moment marginPercent is null
  // because we do not yet know your actual
  // live VTpass merchant margin.
  //
  // Therefore:
  //
  // providerCost = null
  // grossProfit  = null
  //
  // We DO NOT invent a profit figure.
  //
  // Once we know the actual margin, simply
  // update service-margin.config.ts.
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
      "AIRTIME PURCHASE STARTED"
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
        // 2. SEND REQUEST TO VTPASS
        // ======================================

        const providerResponse =
          await vtpassProvider.buyAirtime({
            network: normalizedNetwork,

            phone: phone.trim(),

            amount,
          });

        console.log(
          "========== VTPASS RESPONSE =========="
        );

        console.log(
          JSON.stringify(
            providerResponse,
            null,
            2
          )
        );

        console.log(
          "====================================="
        );

        // ======================================
        // 3. VTPASS FAILED
        // ======================================

        if (
          !providerResponse ||
          !providerResponse.success
        ) {
          console.log(
            "❌ VTpass airtime purchase failed"
          );

          throw new AppError(
            providerResponse?.message ||
              "Airtime purchase failed",
            400
          );
        }

        console.log(
          "✅ VTpass purchase successful"
        );

        // ======================================
        // 4. CREATE CUSTOMER TRANSACTION
        // ======================================

        const transaction =
          await createTransaction({
            userId,

            type: "DEBIT",

            category: "AIRTIME",

            amount,

            status: "SUCCESS",

            description:
              `${normalizedNetwork.toUpperCase()} Airtime Purchase`,

            balanceBefore,

            balanceAfter,

            metadata: {
              network:
                normalizedNetwork,

              phone,

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
          "========== AIRTIME TRANSACTION =========="
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
          "=========================================="
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

            category: "AIRTIME_SALE",

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
              `${normalizedNetwork.toUpperCase()} Airtime`,

            user:
              userId,

            transaction:
              transaction._id,

            reference:
              `AIRTIME-SALE-${transaction.reference}`,

            description:
              `${normalizedNetwork.toUpperCase()} Airtime Sale`,

            metadata: {
              network:
                normalizedNetwork,

              phone,

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
            "Airtime purchase successful",

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
        "Airtime purchase failed",
        500
      );
    }

    console.log(
      "✅ AIRTIME PURCHASE COMPLETED"
    );

    return response;

  } catch (error: any) {

    console.error(
      "\n======================================"
    );

    console.error(
      "AIRTIME PURCHASE ERROR"
    );

    console.error(error);

    console.error(
      "======================================\n"
    );

    throw error;

  } finally {

    await session.endSession();

    console.log(
      "========== AIRTIME PURCHASE ENDED ==========\n"
    );
  }
};