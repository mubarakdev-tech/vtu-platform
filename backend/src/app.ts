import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";
import airtimeRoutes from "./routes/airtime.routes";
import transactionRoutes from "./routes/transaction.routes";
import dataRoutes from "./routes/data.routes";

import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VTU Platform API is running 🚀",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/airtime", airtimeRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/transactions", transactionRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;