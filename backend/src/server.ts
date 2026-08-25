import app from "./app";
import connectDB from "./config/db";
import env from "./config/env";
import logger from "./utils/logger";
import { seedProviders } from "./seed/provider.seed";

const startServer = async () => {
  try {
    // ==========================================
    // 1. VALIDATE ENVIRONMENT
    // ==========================================

    logger.info(
      `Starting server in ${env.NODE_ENV} mode...`
    );

    // ==========================================
    // 2. CONNECT TO MONGODB
    // ==========================================

    await connectDB();

    logger.info(
      "MongoDB connected successfully."
    );

    // ==========================================
    // 3. SEED ABUPAY PROVIDERS
    // ==========================================

    await seedProviders();

    // ==========================================
    // 4. START HTTP SERVER
    // ==========================================

    const server = app.listen(
      env.PORT,
      () => {
        logger.info(
          `🚀 Server running on http://localhost:${env.PORT}`
        );
      }
    );

    // ==========================================
    // 5. GRACEFUL SHUTDOWN - SIGINT
    // ==========================================

    process.on("SIGINT", async () => {
      logger.info(
        "Received SIGINT. Shutting down gracefully..."
      );

      server.close(() => {
        logger.info(
          "HTTP server closed."
        );

        process.exit(0);
      });
    });

    // ==========================================
    // 6. GRACEFUL SHUTDOWN - SIGTERM
    // ==========================================

    process.on("SIGTERM", async () => {
      logger.info(
        "Received SIGTERM. Shutting down gracefully..."
      );

      server.close(() => {
        logger.info(
          "HTTP server closed."
        );

        process.exit(0);
      });
    });

  } catch (error) {
    // ==========================================
    // STARTUP ERROR
    // ==========================================

    logger.error(
      error instanceof Error
        ? error.stack || error.message
        : String(error)
    );

    process.exit(1);
  }
};

// ==========================================
// START APPLICATION
// ==========================================

startServer();
