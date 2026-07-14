import { v4 as uuidv4 } from "uuid";
import { ClientSession } from "mongoose";
import Transaction from "../models/transaction.model";

interface CreateTransactionParams {
  userId: string;
  type: "CREDIT" | "DEBIT";
  category:
    | "FUNDING"
    | "TRANSFER"
    | "AIRTIME"
    | "DATA"
    | "ELECTRICITY"
    | "TV";
  amount: number;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  description: string;
  metadata?: Record<string, any>;
  session?: ClientSession;
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
  const [transaction] = await Transaction.create(
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
    session ? { session } : {}
  );

  return transaction;
};