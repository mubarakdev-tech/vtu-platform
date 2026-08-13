import { Request, Response, NextFunction } from "express";
import { getWallet, creditWallet } from "../services/wallet.service";
import { createTransaction } from "../services/transaction.service";
import paystack from "../config/paystack";
import AppError from "../utils/apperror";
import Transaction from "../models/transaction.model"; // adjust path if different

/**
 * Get current user wallet
 */
export const getMyWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const wallet = await getWallet(userId);

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize Paystack Funding
 */
export const initializeFunding = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    const { amount } = req.body;

    if (!userId || !email) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!amount || Number(amount) < 100) {
      return next(new AppError("Minimum funding amount is ₦100", 400));
    }

    const amountInKobo = Math.round(Number(amount) * 100);

    const response = await paystack.post("/transaction/initialize", {
      email,
      amount: amountInKobo,
      currency: "NGN",
      callback_url: `${process.env.FRONTEND_URL}/dashboard/wallet`,
      metadata: {
        userId,
        amount: Number(amount),
      },
    });

    const data = response.data;

    if (!data.status) {
      return next(new AppError("Unable to initialize payment", 400));
    }

    res.status(200).json({
      success: true,
      message: "Payment initialized",
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
        email: email,
      },
    });
  } catch (error: any) {
    console.error("Paystack Initialize Error:", error?.response?.data || error);
    next(
      new AppError(
        error?.response?.data?.message || "Payment initialization failed",
        500
      )
    );
  }
};

/**
 * Verify Paystack Payment & Credit Wallet (with double-credit protection)
 */
export const verifyFunding = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { reference } = req.body;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!reference) {
      return next(new AppError("Payment reference is required", 400));
    }

    // ============================================
    // PREVENT DOUBLE CREDIT
    // ============================================
    const existingTransaction = await Transaction.findOne({
      "metadata.reference": reference,
      status: "SUCCESS",
      category: "WALLET_FUNDING",
    });

    if (existingTransaction) {
      const wallet = await getWallet(userId);

      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        data: {
          balance: wallet.balance,
          amount: existingTransaction.amount,
          reference,
          alreadyProcessed: true,
        },
      });
    }

    // Verify with Paystack
    const response = await paystack.get(`/transaction/verify/${reference}`);
    const data = response.data;

    if (!data.status || data.data.status !== "success") {
      return next(new AppError("Payment not successful", 400));
    }

    const amount = data.data.amount / 100; // convert from kobo
    const paidUserId = data.data.metadata?.userId;

    // Security check
    if (paidUserId && paidUserId !== userId) {
      return next(new AppError("Invalid payment", 400));
    }

    // Credit wallet
    const wallet = await creditWallet({
      userId,
      amount,
    });

    // Record transaction
    await createTransaction({
      userId,
      type: "CREDIT",
      category: "WALLET_FUNDING",
      amount,
      status: "SUCCESS",
      description: "Wallet Funding via Paystack",
      metadata: {
        reference,
        paystackData: data.data,
      },
    });

    res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      data: {
        balance: wallet.balance,
        amount,
        reference,
      },
    });
  } catch (error: any) {
    console.error("Paystack Verify Error:", error?.response?.data || error);
    next(
      new AppError(
        error?.response?.data?.message || "Payment verification failed",
        500
      )
    );
  }
};