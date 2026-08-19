import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IFinancialLedger
  extends Document {

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

  /**
   * Amount paid by the customer.
   *
   * Example:
   * Customer buys ₦1,000 airtime
   * customerAmount = 1000
   */
  customerAmount?: number;

  /**
   * Amount charged by the provider.
   *
   * Example:
   * VTpass cost = ₦980
   *
   * This can remain undefined while
   * provider pricing is unavailable.
   */
  providerCost?: number;

  /**
   * AbuPay gross profit.
   *
   * customerAmount - providerCost
   */
  grossProfit?: number;

  /**
   * Provider used for the transaction.
   */
  provider?: string;

  /**
   * Service purchased.
   */
  service?: string;

  /**
   * Customer involved.
   */
  user?: mongoose.Types.ObjectId;

  /**
   * Related customer transaction.
   */
  transaction?: mongoose.Types.ObjectId;

  /**
   * Unique financial reference.
   */
  reference: string;

  description?: string;

  metadata?: Record<string, any>;
}

const financialLedgerSchema =
  new Schema<IFinancialLedger>(
    {
      type: {
        type: String,
        enum: [
          "REVENUE",
          "EXPENSE",
        ],
        required: true,
        index: true,
      },

      category: {
        type: String,
        enum: [
          "AIRTIME_SALE",
          "DATA_SALE",
          "WALLET_FUNDING",
          "PAYSTACK_FEE",
          "PROVIDER_COST",
          "REFUND",
          "OTHER_REVENUE",
          "OTHER_EXPENSE",
        ],
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      customerAmount: {
        type: Number,
        min: 0,
      },

      providerCost: {
        type: Number,
        min: 0,
      },

      grossProfit: {
        type: Number,
      },

      provider: {
        type: String,
        trim: true,
      },

      service: {
        type: String,
        trim: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },

      transaction: {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
        index: true,
      },

      reference: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      description: {
        type: String,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

const FinancialLedger: Model<IFinancialLedger> =
  (mongoose.models.FinancialLedger as Model<IFinancialLedger>) ||
  mongoose.model<IFinancialLedger>(
    "FinancialLedger",
    financialLedgerSchema
  );

export default FinancialLedger;