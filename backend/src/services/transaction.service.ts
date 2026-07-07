import Transaction from "../models/transaction.model";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

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

  session?: mongoose.ClientSession;
}

export const createTransaction = async ({
  userId,
  type,
  category,
  amount,
  status = "SUCCESS",
  description,
  metadata = {},
  session,
}: CreateTransactionParams) => {
  return await Transaction.create(
    [
      {
        user: userId,
        type,
        category,
        amount,
        status,
        reference: uuidv4(),
        description,
        metadata,
      },
    ],
    { session }
  );
};