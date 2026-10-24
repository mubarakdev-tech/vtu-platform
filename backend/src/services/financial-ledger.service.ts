
import mongoose from "mongoose";
import FinancialLedger from "../models/financialLedger.model";

interface CreateFinancialLedgerParams {
  type: "REVENUE" | "EXPENSE";

  category:
    | "AIRTIME_SALE"
    | "DATA_SALE"
    | "WALLET_FUNDING"
    | "PAYSTACK_FEE"
    | "PROVIDER_COST"
    | "REFUND"
    | "OTHER_REVENUE"
    | "OTHER_EXPENSE";

  amount: number;
  customerAmount?: number;
  providerCost?: number;
  grossProfit?: number;
  provider?: string;
  service?: string;
  user?: string;
  transaction?: mongoose.Types.ObjectId;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  session?: mongoose.ClientSession;
}

export const createFinancialLedgerEntry = async ({
  type,
  category,
  amount,
  customerAmount,
  providerCost,
  grossProfit,
  provider,
  service,
  user,
  transaction,
  reference,
  description,
  metadata,
  session,
}: CreateFinancialLedgerParams) => {
  const entry = {
    type,
    category,
    amount,
    customerAmount,
    providerCost,
    grossProfit,
    provider,
    service,
    user,
    transaction,
    reference,
    description,
    metadata,
  };

  try {
    const ledger = await FinancialLedger.findOneAndUpdate(
      { reference },
      { $setOnInsert: entry },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        ...(session ? { session } : {}),
      }
    );

    if (!ledger) {
      throw new Error(
        `Failed to create financial ledger entry: ${reference}`
      );
    }

    return ledger;
  } catch (error: any) {
    if (error?.code === 11000) {
      const existingQuery = FinancialLedger.findOne({ reference });

      if (session) {
        existingQuery.session(session);
      }

      const existing = await existingQuery;

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
};
