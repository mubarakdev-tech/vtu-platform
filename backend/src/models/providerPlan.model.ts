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

export interface IProviderPlan extends Document {
  provider: Types.ObjectId;

  network: string;
  dataType: DataType;

  name: string;
  validity?: string;

  providerPlanCode: string;

  providerCost: number;

  active: boolean;

  metadata?: Record<string, any>;
}

const ProviderPlanSchema =
  new Schema<IProviderPlan>(
    {
      provider: {
        type: Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
        index: true,
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

      /**
       * Human-readable provider plan name.
       *
       * Example:
       * MTN 1GB - 30 Days
       */
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
       * The actual code required by the provider API.
       *
       * VTpass example:
       * mtn-1gb-30days
       */
      providerPlanCode: {
        type: String,
        required: true,
        trim: true,
      },

      /**
       * What AbuPay actually pays the provider.
       */
      providerCost: {
        type: Number,
        required: true,
        min: 0,
      },

      active: {
        type: Boolean,
        default: true,
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

ProviderPlanSchema.index(
  {
    provider: 1,
    network: 1,
    dataType: 1,
    providerPlanCode: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model<IProviderPlan>(
  "ProviderPlan",
  ProviderPlanSchema
);