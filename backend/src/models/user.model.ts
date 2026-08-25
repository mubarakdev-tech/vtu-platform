import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  phone?: string | null;
  password: string;

  role: "user" | "admin" | "super_admin";

  isVerified: boolean;
  verificationToken?: string | null;

  // Password reset
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;

  // AbuPay profile
  profilePicture?: string | null;

  // ==========================================
  // REFERRAL SYSTEM
  // ==========================================

  // Unique referral code belonging to this user
  referralCode?: string | null;

  // User who referred this customer
  referredBy?: mongoose.Types.ObjectId | null;

  // Number of customers referred
  referralCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
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
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "super_admin",
      ],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: null,
    },

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // ==========================================
    // PROFILE PICTURE
    // ==========================================

    profilePicture: {
      type: String,
      default: null,
    },

    // ==========================================
    // REFERRAL SYSTEM
    // ==========================================

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      default: null,
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError during development
const User =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;
