import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IProvider extends Document {
  key: string;
  displayName: string;
  active: boolean;
  sortOrder: number;
  supportsData: boolean;
  supportsAirtime: boolean;
}

const ProviderSchema = new Schema<IProvider>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    supportsData: {
      type: Boolean,
      default: true,
    },

    supportsAirtime: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProvider>(
  "Provider",
  ProviderSchema
);
