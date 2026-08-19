import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";

dotenv.config();

const makeAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    const email = process.argv[2];

    if (!email) {
      console.log(
        "Usage: npx ts-node src/scripts/make-admin.ts your@email.com"
      );
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      console.log("User not found:", email);
      process.exit(1);
    }

    user.role = "admin";

    await user.save();

    console.log("");
    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("=================================");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("MAKE ADMIN ERROR:", error);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
};

makeAdmin();