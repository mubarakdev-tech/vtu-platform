import mongoose, { Schema, Document } from "mongoose";

export interface IDataPlan extends Document {
  network: string;
  name: string;
  amount: number;
  active: boolean;
}

const DataPlanSchema = new Schema(
  {
    network: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDataPlan>(
  "DataPlan",
  DataPlanSchema
);