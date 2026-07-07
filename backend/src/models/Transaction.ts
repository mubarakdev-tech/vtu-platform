import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  network?: string;
  phone?: string;
  amount: number;
  status: string;
}

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    network: String,
    phone: String,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "successful",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);