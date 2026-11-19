import mongoose, { Document, Schema } from "mongoose";

export interface IAirtimePricingPolicy extends Document {
  providerKey: string;
  discountRates: {
    mtn: number | null;
    airtel: number | null;
    glo: number | null;
    "9mobile": number | null;
  };
}

const AirtimePricingPolicySchema =
  new Schema<IAirtimePricingPolicy>(
    {
      providerKey: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      discountRates: {
        mtn: { type: Number, default: null, min: 0, max: 100 },
        airtel: { type: Number, default: null, min: 0, max: 100 },
        glo: { type: Number, default: null, min: 0, max: 100 },
        "9mobile": { type: Number, default: null, min: 0, max: 100 },
      },
    },
    { timestamps: true }
  );

export default mongoose.models.AirtimePricingPolicy ||
  mongoose.model<IAirtimePricingPolicy>(
    "AirtimePricingPolicy",
    AirtimePricingPolicySchema
  );
