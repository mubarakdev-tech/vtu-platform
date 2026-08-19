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
import financialLedgerRoutes from "./routes/financial-ledger.routes";

import { errorHandler } from "./middleware/error.middleware";
import logger from "./utils/logger";

const app = express();

// =====================================================
// SECURITY
// =====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// =====================================================
// CORS
// =====================================================
//
// Customer application:
// http://localhost:3000
//
// Admin application:
// http://localhost:3001
//
// Backend:
// http://localhost:5000
//
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {
      // Allow requests from Postman,
      // curl and other clients without
      // an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow customer frontend.
      if (
        origin ===
        "http://localhost:3000"
      ) {
        callback(null, true);
        return;
      }

      // Allow admin frontend.
      if (
        origin ===
        "http://localhost:3001"
      ) {
        callback(null, true);
        return;
      }

      console.log(
        "CORS BLOCKED ORIGIN:",
        origin
      );

      callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// COMPRESSION
// =====================================================

app.use(
  compression()
);

// =====================================================
// BODY PARSING
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =====================================================
// COOKIE PARSER
// =====================================================

app.use(
  cookieParser()
);

// =====================================================
// RATE LIMITING
// =====================================================

const limiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 500,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api",
  limiter
);

// =====================================================
// HTTP LOGGING
// =====================================================

app.use(
  morgan("combined", {
    stream: {
      write: (
        message
      ) => {
        logger.info(
          message.trim()
        );
      },
    },
  })
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/",
  (
    req,
    res
  ) => {
    res.status(200).json({
      success: true,
      message:
        "VTU Platform API is running 🚀",
    });
  }
);

// =====================================================
// API HEALTH CHECK
// =====================================================

app.get(
  "/api",
  (
    req,
    res
  ) => {
    res.status(200).json({
      success: true,
      message:
        "AbuPay API is running 🚀",
    });
  }
);

// =====================================================
// AUTH ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

// =====================================================
// USER ROUTES
// =====================================================

app.use(
  "/api/user",
  userRoutes
);

// =====================================================
// WALLET ROUTES
// =====================================================

app.use(
  "/api/wallet",
  walletRoutes
);

// =====================================================
// AIRTIME ROUTES
// =====================================================

app.use(
  "/api/airtime",
  airtimeRoutes
);

// =====================================================
// DATA ROUTES
// =====================================================

app.use(
  "/api/data",
  dataRoutes
);

// =====================================================
// TRANSACTION ROUTES
// =====================================================

app.use(
  "/api/transactions",
  transactionRoutes
);

// =====================================================
// DASHBOARD ROUTES
// =====================================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// =====================================================
// FINANCIAL LEDGER ROUTES
// =====================================================

app.use(
  "/api/financial-ledger",
  financialLedgerRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (
    req,
    res
  ) => {
    res.status(404).json({
      success: false,
      message:
        "Route not found",
      path:
        req.originalUrl,
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  errorHandler
);

// =====================================================
// EXPORT
// =====================================================

export default app;
