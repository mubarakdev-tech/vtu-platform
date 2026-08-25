import { randomUUID } from "crypto";
import { ClientSession } from "mongoose";
import Transaction from "../models/transaction.model";

interface CreateTransactionParams {
  userId: string;

  type: "CREDIT" | "DEBIT";

  category:
    | "WALLET_FUNDING"
    | "TRANSFER"
    | "AIRTIME"
    | "DATA"
    | "CABLE"
    | "ELECTRICITY"
    | "REFUND";

  amount: number;

  status?: "PENDING" | "SUCCESS" | "FAILED";

  description?: string;

  metadata?: Record<string, any>;

  balanceBefore?: number;
  balanceAfter?: number;

  gateway?: "PAYSTACK" | "OTHER";
  gatewayReference?: string;

  session?: ClientSession;
}

/**
 * Create transaction
 */
export const createTransaction = async ({
  userId,
  type,
  category,
  amount,
  status = "SUCCESS",
  description = "",
  metadata = {},
  balanceBefore,
  balanceAfter,
  gateway,
  gatewayReference,
  session,
}: CreateTransactionParams) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (amount <= 0) {
    throw new Error("Transaction amount must be greater than zero");
  }

  const reference = `${category}-${randomUUID()
    .replace(/-/g, "")
    .toUpperCase()}`;

  console.log("\n========== CREATE TRANSACTION ==========");
  console.log("User ID          :", userId);
  console.log("Type             :", type);
  console.log("Category         :", category);
  console.log("Amount           :", amount);
  console.log("Status           :", status);
  console.log("Reference        :", reference);
  console.log("Gateway          :", gateway || "N/A");
  console.log("Gateway Reference:", gatewayReference || "N/A");
  console.log("Balance Before   :", balanceBefore ?? "N/A");
  console.log("Balance After    :", balanceAfter ?? "N/A");
  console.log("Description      :", description);
  console.log("========================================\n");

  const [transaction] = await Transaction.create(
    [
      {
        user: userId,
        type,
        category,
        amount,
        status,
        reference,
        description,
        balanceBefore,
        balanceAfter,
        gateway,
        gatewayReference,
        metadata,
      },
    ],
    session ? { session } : {}
  );

  console.log("Transaction saved successfully");

  return transaction;
};

/**
 * Find transaction by payment gateway reference
 *
 * Used to prevent the same payment from
 * being credited to the wallet more than once.
 */
export const findTransactionByGatewayReference = async (
  gateway: "PAYSTACK" | "OTHER",
  gatewayReference: string,
  session?: ClientSession
) => {
  return Transaction.findOne({
    gateway,
    gatewayReference,
  }).session(session || null);
};