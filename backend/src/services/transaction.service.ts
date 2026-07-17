import { v4 as uuidv4 } from "uuid";
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
  session?: ClientSession;
}

export const createTransaction = async ({
  userId,
  type,
  category,
  amount,
  status = "SUCCESS",
  description = "",
  metadata = {},
  session,
}: CreateTransactionParams) => {
  const reference = `${category}-${uuidv4()
    .replace(/-/g, "")
    .toUpperCase()}`;

  console.log("\n========== CREATE TRANSACTION ==========");
  console.log("User ID     :", userId);
  console.log("Type        :", type);
  console.log("Category    :", category);
  console.log("Amount      :", amount);
  console.log("Status      :", status);
  console.log("Reference   :", reference);
  console.log("Description :", description);
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
        metadata,
      },
    ],
    session ? { session } : {}
  );

  console.log("✅ Transaction saved successfully");

  return transaction;
};