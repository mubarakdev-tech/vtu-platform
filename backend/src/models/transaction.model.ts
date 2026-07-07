import mongoose, { Schema, Document } from "mongoose";

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

export default mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);