import mongoose from "mongoose";
import env from "./env";
import logger from "../utils/logger";

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error(
      error instanceof Error ? error.stack || error.message : String(error)
    );
    process.exit(1);
  }
};

export default connectDB;