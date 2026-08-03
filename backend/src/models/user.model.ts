import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  isVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
}


const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },


    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },


    phone: {
      type: String,
      required: true,
      trim: true,
    },


    password: {
      type: String,
      required: true,
    },


    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },


    isVerified: {
      type: Boolean,
      default: false,
    },


    verificationToken: {
      type: String,
    },

  },
  {
    timestamps: true,
  }
);


export default mongoose.model<IUser>("User", userSchema);