import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;

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

  balanceBefore?: number;
  balanceAfter?: number;

  gateway?: "PAYSTACK" | "OTHER";

  gatewayReference?: string;

  status: "PENDING" | "SUCCESS" | "FAILED";

  reference: string;

  description?: string;

  metadata?: Record<string, any>;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "WALLET_FUNDING",
        "TRANSFER",
        "AIRTIME",
        "DATA",
        "CABLE",
        "ELECTRICITY",
        "REFUND",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
    },

    balanceAfter: {
      type: Number,
    },

    gateway: {
      type: String,
      enum: ["PAYSTACK", "OTHER"],
    },

    gatewayReference: {
      type: String,
      sparse: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    reference: {
      type: String,
      unique: true,
      required: true,
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

// Prevent duplicate successful processing of the same gateway payment
transactionSchema.index(
  { gateway: 1, gatewayReference: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Prevent OverwriteModelError during development
const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;