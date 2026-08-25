import mongoose from "mongoose";
import crypto from "crypto";
import User from "../models/user.model";
import dotenv from "dotenv";

dotenv.config();

const generateReferralCode =
  async (): Promise<string> => {
    let code = "";
    let exists = true;

    while (exists) {
      code =
        `ABU${crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase()}`;

      const existing =
        await User.findOne({
          referralCode: code,
        });

      exists = !!existing;
    }

    return code;
  };

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "Connected to MongoDB"
    );

    const users =
      await User.find({
        $or: [
          {
            referralCode: null,
          },
          {
            referralCode: {
              $exists: false,
            },
          },
        ],
      });

    console.log(
      `Users requiring referral codes: ${users.length}`
    );

    for (const user of users) {
      user.referralCode =
        await generateReferralCode();

      if (
        typeof user.referralCount !==
        "number"
      ) {
        user.referralCount = 0;
      }

      await user.save();

      console.log(
        `${user.email} -> ${user.referralCode}`
      );
    }

    console.log(
      "Referral code migration completed."
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error(
      "Referral migration error:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

run();
