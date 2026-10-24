
import {
  Response,
  NextFunction,
} from "express";

import { getWallet } from "../services/wallet.service";
import paystack from "../config/paystack";
import AppError from "../utils/AppError";
import { processWalletFunding } from "../services/wallet.funding.service";
import {
  calculatePaystackCustomerFee,
} from "../services/paystack-fee.service";

import { AuthRequest } from "../middleware/auth.middleware";
import FinancialLedger from "../models/financialLedger.model";

/**
 * ==========================================
 * GET CURRENT USER WALLET
 * ==========================================
 */
export const getMyWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(
        new AppError("Unauthorized", 401)
      );
    }

    const wallet = await getWallet(userId);

    return res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * CALCULATE PAYSTACK FUNDING FEE
 * ==========================================
 *
 * Used by the frontend to display the
 * estimated payment processing fee before
 * the customer pays.
 */
export const calculateFundingFee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(
        new AppError(
          "Unauthorized",
          401
        )
      );
    }

    const rawAmount = req.query.amount;
    const fundingAmount = Number(rawAmount);

    console.log(
      "================================="
    );
    console.log("FUNDING FEE CALCULATION");
    console.log("Requested amount:", fundingAmount);
    console.log("User:", userId);
    console.log(
      "================================="
    );

    /**
     * Validate amount.
     */
    if (
      !Number.isFinite(fundingAmount) ||
      fundingAmount <= 0
    ) {
      return next(
        new AppError(
          "Invalid funding amount",
          400
        )
      );
    }

    /**
     * Whole Naira only.
     */
    if (!Number.isInteger(fundingAmount)) {
      return next(
        new AppError(
          "Funding amount must be a whole number",
          400
        )
      );
    }

    /**
     * Minimum funding.
     */
    if (fundingAmount < 100) {
      return next(
        new AppError(
          "Minimum funding amount is ₦100",
          400
        )
      );
    }

    /**
     * Calculate estimated Paystack
     * customer fee.
     */
    const result =
      calculatePaystackCustomerFee(fundingAmount);

    console.log(
      "Funding amount:",
      result.fundingAmount
    );
    console.log(
      "Estimated fee:",
      result.estimatedFee
    );
    console.log(
      "Estimated total:",
      result.estimatedTotal
    );

    return res.status(200).json({
      success: true,
      data: {
        fundingAmount: result.fundingAmount,
        estimatedFee: result.estimatedFee,
        estimatedTotal: result.estimatedTotal,
        currency: "NGN",
        isEstimate: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * INITIALIZE PAYSTACK WALLET FUNDING
 * ==========================================
 */
export const initializeFunding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return next(
        new AppError(
          "Unauthorized",
          401
        )
      );
    }

    const rawAmount = req.body.amount;

    console.log(
      "================================="
    );
    console.log("PAYSTACK INITIALIZATION REQUEST");
    console.log("Raw amount:", rawAmount);
    console.log("Raw amount type:", typeof rawAmount);
    console.log("User:", userId);
    console.log("Email:", email);
    console.log(
      "================================="
    );

    /**
     * Convert incoming amount to number.
     */
    const fundingAmount = Number(rawAmount);

    /**
     * Validate amount.
     */
    if (
      !Number.isFinite(fundingAmount) ||
      fundingAmount <= 0
    ) {
      return next(
        new AppError(
          "Amount must be a number greater than zero",
          400
        )
      );
    }

    /**
     * Wallet funding must be whole Naira.
     */
    if (!Number.isInteger(fundingAmount)) {
      return next(
        new AppError(
          "Funding amount must be a whole number with no decimal places",
          400
        )
      );
    }

    /**
     * Minimum funding.
     */
    if (fundingAmount < 100) {
      return next(
        new AppError(
          "Minimum funding amount is ₦100",
          400
        )
      );
    }

    /**
     * Convert Naira to Kobo.
     */
    const amountInKobo = fundingAmount * 100;

    /**
     * Ensure Paystack gets an integer.
     */
    if (
      !Number.isInteger(amountInKobo) ||
      amountInKobo <= 0
    ) {
      return next(
        new AppError(
          "Invalid Paystack amount",
          400
        )
      );
    }

    console.log(
      "================================="
    );
    console.log("PAYSTACK AMOUNT CHECK");
    console.log("Funding amount:", fundingAmount);
    console.log("Amount in Kobo:", amountInKobo);
    console.log("Amount type:", typeof amountInKobo);
    console.log(
      "Is integer:",
      Number.isInteger(amountInKobo)
    );
    console.log(
      "================================="
    );

    /**
     * ========================================
     * INITIALIZE PAYSTACK
     * ========================================
     *
     * Continue sending the original wallet
     * funding amount. Paystack is configured
     * to pass transaction fees to the customer.
     */
    const response = await paystack.post(
      "/transaction/initialize",
      {
        email: email.trim(),
        amount: amountInKobo,
        currency: "NGN",
        callback_url:
          `${process.env.FRONTEND_URL}/dashboard/wallet`,
        metadata: {
          userId: String(userId),
          fundingAmount,
          fundingAmountKobo: amountInKobo,
          service: "WALLET_FUNDING",
        },
      }
    );

    console.log(
      "================================="
    );
    console.log("PAYSTACK INITIALIZE RESPONSE");
    console.log(response.data);
    console.log(
      "================================="
    );

    const data = response.data;

    if (
      !data ||
      data.status !== true ||
      !data.data
    ) {
      return next(
        new AppError(
          data?.message ||
            "Unable to initialize Paystack payment",
          400
        )
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        authorization_url:
          data.data.authorization_url,
        access_code:
          data.data.access_code,
        reference:
          data.data.reference,
        email,
        amount: fundingAmount,
        amountInKobo,
      },
    });
  } catch (error: any) {
    console.error(
      "================================="
    );
    console.error("PAYSTACK INITIALIZATION ERROR");
    console.error(
      error?.response?.data || error
    );
    console.error(
      "================================="
    );

    return next(
      new AppError(
        error?.response?.data?.message ||
          error?.message ||
          "Payment initialization failed",
        error?.response?.status || 500
      )
    );
  }
};

/**
 * ==========================================
 * VERIFY PAYSTACK FUNDING
 * ==========================================
 */
export const verifyFunding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("🔥 VERIFY FUNDING ENDPOINT HIT");
  console.log("VERIFY BODY:", req.body);

  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(
        new AppError(
          "Unauthorized",
          401
        )
      );
    }

    const { reference } = req.body;

    if (
      !reference ||
      typeof reference !== "string"
    ) {
      return next(
        new AppError(
          "Payment reference is required",
          400
        )
      );
    }

    const cleanReference = reference.trim();

    if (!cleanReference) {
      return next(
        new AppError(
          "Invalid payment reference",
          400
        )
      );
    }

    console.log(
      "================================="
    );
    console.log("VERIFYING PAYSTACK PAYMENT");
    console.log("Reference:", cleanReference);
    console.log("User:", userId);
    console.log(
      "================================="
    );

    /**
     * ========================================
     * VERIFY WITH PAYSTACK
     * ========================================
     */
    const response = await paystack.get(
      `/transaction/verify/${encodeURIComponent(
        cleanReference
      )}`
    );

    console.log(
      "================================="
    );
    console.log("PAYSTACK VERIFY RESPONSE");
    console.log(
      JSON.stringify(response.data, null, 2)
    );
    console.log(
      "================================="
    );

    const data = response.data;

    if (
      !data ||
      data.status !== true ||
      !data.data
    ) {
      return next(
        new AppError(
          data?.message ||
            "Unable to verify payment with Paystack",
          400
        )
      );
    }

    const transaction = data.data;

    /**
     * ========================================
     * PAYMENT STATUS
     * ========================================
     */
    if (transaction.status !== "success") {
      return next(
        new AppError(
          "Payment was not successful",
          400
        )
      );
    }

    /**
     * ========================================
     * REFERENCE
     * ========================================
     */
    if (transaction.reference !== cleanReference) {
      return next(
        new AppError(
          "Payment reference mismatch",
          400
        )
      );
    }

    /**
     * ========================================
     * CURRENCY
     * ========================================
     */
    if (transaction.currency !== "NGN") {
      return next(
        new AppError(
          "Invalid payment currency",
          400
        )
      );
    }

    /**
     * ========================================
     * USER OWNERSHIP
     * ========================================
     */
    const metadata = transaction.metadata || {};
    const paidUserId = metadata.userId;

    if (!paidUserId) {
      return next(
        new AppError(
          "Payment ownership could not be verified",
          400
        )
      );
    }

    if (String(paidUserId) !== String(userId)) {
      return next(
        new AppError(
          "Invalid payment ownership",
          403
        )
      );
    }

    /**
     * ========================================
     * AMOUNT
     * ========================================
     */
    const paidAmountKobo = Number(transaction.amount);

    if (
      !Number.isInteger(paidAmountKobo) ||
      paidAmountKobo <= 0
    ) {
      return next(
        new AppError(
          "Invalid payment amount",
          400
        )
      );
    }

    const paidAmount = paidAmountKobo / 100;

    /**
     * Get original wallet funding amount
     * from the Paystack metadata.
     */
    const fundingAmount =
      Number(metadata.fundingAmount);

    const fundingAmountKobo =
      Number(metadata.fundingAmountKobo);

    if (
      !Number.isInteger(fundingAmount) ||
      fundingAmount <= 0
    ) {
      return next(
        new AppError(
          "Original wallet funding amount could not be verified",
          400
        )
      );
    }

    if (
      !Number.isInteger(fundingAmountKobo) ||
      fundingAmountKobo <= 0
    ) {
      return next(
        new AppError(
          "Original wallet funding Kobo amount could not be verified",
          400
        )
      );
    }

    console.log(
      "================================="
    );
    console.log("PAYMENT AMOUNT VERIFICATION");
    console.log("Paystack paid amount:", paidAmount);
    console.log("Paystack paid Kobo:", paidAmountKobo);
    console.log("Wallet funding amount:", fundingAmount);
    console.log("Wallet funding Kobo:", fundingAmountKobo);
    console.log("Paystack fees:", transaction.fees);
    console.log(
      "Paystack requested amount:",
      transaction.requested_amount
    );
    console.log(
      "================================="
    );

    /**
     * ========================================
     * AMOUNT VALIDATION
     * ========================================
     */
    const requestedAmountKobo =
      Number(transaction.requested_amount);

    const amountToCompare =
      Number.isInteger(requestedAmountKobo) &&
      requestedAmountKobo > 0
        ? requestedAmountKobo
        : paidAmountKobo;

    if (amountToCompare !== fundingAmountKobo) {
      console.error(
        "PAYMENT INITIALIZED AMOUNT MISMATCH",
        {
          reference: cleanReference,
          paidAmountKobo,
          requestedAmountKobo,
          amountToCompare,
          fundingAmountKobo,
          paidAmount,
          fundingAmount,
        }
      );

      return next(
        new AppError(
          "Payment amount does not match the initialized amount",
          400
        )
      );
    }

    /**
     * ========================================
     * PROCESS WALLET FUNDING
     * ========================================
     *
     * Credit only the original wallet funding
     * amount. Never credit the Paystack fee.
     */
    const result = await processWalletFunding({
      userId,
      amount: fundingAmount,
      gateway: "PAYSTACK",
      gatewayReference: cleanReference,
      metadata: {
        paystackData: transaction,
        requestedFundingAmount: fundingAmount,
        paystackPaidAmount: paidAmount,
        paystackFees: transaction.fees || 0,
      },
    });

    /**
     * ========================================
     * RECORD PAYSTACK PROCESSING FEE
     * ========================================
     *
     * Paystack reports transaction.fees in Kobo.
     * The financial ledger stores amounts in Naira.
     *
     * Use a deterministic unique reference and
     * $setOnInsert to avoid duplicate fee entries
     * when the payment is verified repeatedly.
     *
     * This is an EXPENSE, not service revenue.
     */
    const paystackFeeKobo = Number(transaction.fees);
    const feeReference = `PAYSTACK_FEE:${cleanReference}`;

    if (
      Number.isSafeInteger(paystackFeeKobo) &&
      paystackFeeKobo > 0
    ) {
      await FinancialLedger.updateOne(
        {
          reference: feeReference,
        },
        {
          $setOnInsert: {
            type: "EXPENSE",
            category: "PAYSTACK_FEE",
            amount: paystackFeeKobo / 100,
            user: String(userId),
            transaction: result.transaction._id,
            reference: feeReference,
            description:
              `Paystack processing fee for wallet funding ${cleanReference}`,
            metadata: {
              gateway: "PAYSTACK",
              gatewayReference: cleanReference,
              feeKobo: paystackFeeKobo,
              currency: "NGN",
            },
          },
        },
        {
          upsert: true,
        }
      );
    } else if (
      transaction.fees !== undefined &&
      transaction.fees !== null &&
      transaction.fees !== 0
    ) {
      /**
       * Do not invent a fee if Paystack returns
       * an unexpected fee value. Log it so it
       * can be investigated.
       */
      console.error(
        "Paystack fee was not recorded because its value was invalid",
        {
          reference: cleanReference,
          fees: transaction.fees,
        }
      );
    }

    /**
     * ========================================
     * DUPLICATE PAYMENT
     * ========================================
     *
     * The fee-ledger check above also runs when
     * wallet funding was already processed.
     * This allows a retry to repair a missing
     * fee entry without crediting the wallet again.
     */
    if (result.alreadyProcessed) {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        data: {
          balance: result.balance,
          walletBalance: result.balance,
          amount: result.transaction.amount,
          reference: cleanReference,
          transactionReference: cleanReference,
          alreadyProcessed: true,
          transaction: result.transaction,
        },
      });
    }

    /**
     * ========================================
     * SUCCESS
     * ========================================
     */
    return res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      data: {
        balance: result.balance,
        walletBalance: result.balance,

        /**
         * Amount actually credited to AbuPay.
         */
        amount: fundingAmount,

        /**
         * Amount Paystack reports for the transaction.
         */
        paidAmount,

        /**
         * Paystack fee as returned by Paystack.
         * This value is in Kobo when supplied by
         * the Paystack transaction verification API.
         */
        fee: transaction.fees || 0,

        reference: cleanReference,
        transactionReference: cleanReference,
        alreadyProcessed: false,
        transaction: result.transaction,
      },
    });
  } catch (error: any) {
    console.error(
      "================================="
    );
    console.error("PAYSTACK VERIFY ERROR");
    console.error(
      error?.response?.data || error
    );
    console.error(
      "================================="
    );

    if (error?.response?.data) {
      return next(
        new AppError(
          error?.response?.data?.message ||
            "Payment verification failed",
          error?.response?.status || 400
        )
      );
    }

    return next(
      new AppError(
        error?.message ||
          "Payment verification failed",
        500
      )
    );
  }
};
