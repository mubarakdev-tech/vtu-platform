import mongoose from "mongoose";
import FinancialLedger from "../models/financialLedger.model";

interface CreateFinancialLedgerParams {
  type:
    | "REVENUE"
    | "EXPENSE";

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

export const createFinancialLedgerEntry =
  async ({
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

    const ledger =
      await FinancialLedger.create(
        [
          {
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
          },
        ],
        {
          session,
        }
      );

    return ledger[0];
  };