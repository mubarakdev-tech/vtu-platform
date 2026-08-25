import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose";

export type DataType =
  | "DATA"
  | "DATA_SHARE"
  | "GIFTING"
  | "AWOOF";

export interface IDataPlan extends Document {
  provider: Types.ObjectId;
  providerPlan: Types.ObjectId;

  network: string;
  dataType: DataType;

  name: string;
  validity?: string;

  /**
   * Price displayed to the customer.
   */
  amount: number;

  active: boolean;

  sortOrder: number;
}

const DataPlanSchema =
  new Schema<IDataPlan>(
    {
      /**
       * AbuPay provider channel.
       *
       * Example:
       * AbuPay Direct → VTpass
       * AbuPay Value → Bigisub
       * AbuPay Plus → VTU.com.ng
       */
      provider: {
        type: Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
        index: true,
      },

      /**
       * Exact provider product behind this
       * AbuPay plan.
       */
      providerPlan: {
        type: Schema.Types.ObjectId,
        ref: "ProviderPlan",
        required: true,
      },

      network: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      dataType: {
        type: String,
        enum: [
          "DATA",
          "DATA_SHARE",
          "GIFTING",
          "AWOOF",
        ],
        default: "DATA",
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      validity: {
        type: String,
        trim: true,
      },

      /**
       * What the customer pays.
       */
      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      active: {
        type: Boolean,
        default: true,
      },

      /**
       * Controls the order in which plans
       * appear in the customer catalogue.
       */
      sortOrder: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

DataPlanSchema.index({
  provider: 1,
  network: 1,
  dataType: 1,
  active: 1,
  sortOrder: 1,
});

export default mongoose.model<IDataPlan>(
  "DataPlan",
  DataPlanSchema
);
