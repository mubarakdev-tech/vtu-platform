import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.routes";
import airtimeRoutes from "./routes/airtime.routes";
import transactionRoutes from "./routes/transaction.routes";
import dataRoutes from "./routes/data.routes";
import dashboardRoutes from "./routes/dashboard.routes";

import { errorHandler } from "./middleware/error.middleware";
import logger from "./utils/logger";

const app = express();

/**
 * Security Middleware
 */

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(compression());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Read secure cookies
app.use(cookieParser());

/**
 * Rate Limiting
 */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", limiter);

/**
 * HTTP Logging
 */

app.use(
  morgan("combined", {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  })
);

/**
 * Health Check
 */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VTU Platform API is running 🚀",
  });
});

/**
 * API Routes
 */

app.use("/api/auth", authRoutes);

app.use("/api/user", userRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/airtime", airtimeRoutes);

app.use("/api/data", dataRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/dashboard", dashboardRoutes);

/**
 * 404 Handler
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/**
 * Global Error Handler
 */

app.use(errorHandler);

export default app;