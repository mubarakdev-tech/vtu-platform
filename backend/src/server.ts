import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import env from "./config/env";
import logger from "./utils/logger";

const startServer = async () => {
  try {
    // Validate environment variables before anything else
    logger.info(`Starting server in ${env.NODE_ENV} mode...`);

    // Connect to MongoDB
    await connectDB();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT. Shutting down gracefully...");
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM. Shutting down gracefully...");
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  }
};

startServer();