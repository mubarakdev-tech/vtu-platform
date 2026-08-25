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

    const fundingAmount =
      Number(rawAmount);

    console.log(
      "================================="
    );
    console.log(
      "FUNDING FEE CALCULATION"
    );
    console.log(
      "Requested amount:",
      fundingAmount
    );
    console.log(
      "User:",
      userId
    );
    console.log(
      "================================="
    );

    /**
     * Validate amount.
     */
    if (
      !Number.isFinite(
        fundingAmount
      ) ||
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
    if (
      !Number.isInteger(
        fundingAmount
      )
    ) {
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
    if (
      fundingAmount < 100
    ) {
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
      calculatePaystackCustomerFee(
        fundingAmount
      );

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
        fundingAmount:
          result.fundingAmount,

        estimatedFee:
          result.estimatedFee,

        estimatedTotal:
          result.estimatedTotal,

        currency: "NGN",

        /**
         * This tells the frontend
         * that this is an estimate.
         */
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

    const rawAmount =
      req.body.amount;

    console.log(
      "================================="
    );
    console.log(
      "PAYSTACK INITIALIZATION REQUEST"
    );
    console.log(
      "Raw amount:",
      rawAmount
    );
    console.log(
      "Raw amount type:",
      typeof rawAmount
    );
    console.log(
      "User:",
      userId
    );
    console.log(
      "Email:",
      email
    );
    console.log(
      "================================="
    );

    /**
     * Convert incoming amount to number.
     */
    const fundingAmount =
      Number(rawAmount);

    /**
     * Validate amount.
     */
    if (
      !Number.isFinite(
        fundingAmount
      ) ||
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
    if (
      !Number.isInteger(
        fundingAmount
      )
    ) {
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
    if (
      fundingAmount < 100
    ) {
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
    const amountInKobo =
      fundingAmount * 100;

    /**
     * Ensure Paystack gets an integer.
     */
    if (
      !Number.isInteger(
        amountInKobo
      ) ||
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
    console.log(
      "PAYSTACK AMOUNT CHECK"
    );
    console.log(
      "Funding amount:",
      fundingAmount
    );
    console.log(
      "Amount in Kobo:",
      amountInKobo
    );
    console.log(
      "Amount type:",
      typeof amountInKobo
    );
    console.log(
      "Is integer:",
      Number.isInteger(
        amountInKobo
      )
    );
    console.log(
      "================================="
    );

    /**
     * ========================================
     * INITIALIZE PAYSTACK
     * ========================================
     *
     * IMPORTANT:
     *
     * We continue sending the ORIGINAL
     * wallet funding amount.
     *
     * Paystack dashboard is already configured
     * to pass transaction fees to the customer.
     */
    const response =
      await paystack.post(
        "/transaction/initialize",
        {
          email:
            email.trim(),

          /**
           * Paystack receives KOBO.
           *
           * Example:
           * ₦1,000 = 100,000 Kobo
           */
          amount:
            amountInKobo,

          currency:
            "NGN",

          callback_url:
            `${process.env.FRONTEND_URL}/dashboard/wallet`,

          metadata: {
            userId:
              String(userId),

            /**
             * Original amount that
             * should enter wallet.
             */
            fundingAmount:
              fundingAmount,

            /**
             * Original Kobo amount.
             */
            fundingAmountKobo:
              amountInKobo,

            service:
              "WALLET_FUNDING",
          },
        }
      );

    console.log(
      "================================="
    );
    console.log(
      "PAYSTACK INITIALIZE RESPONSE"
    );
    console.log(
      response.data
    );
    console.log(
      "================================="
    );

    const data =
      response.data;

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

    /**
     * Return the exact amount
     * initialized.
     */
    return res.status(200).json({
      success: true,

      message:
        "Payment initialized successfully",

      data: {
        authorization_url:
          data.data
            .authorization_url,

        access_code:
          data.data
            .access_code,

        reference:
          data.data
            .reference,

        email,

        /**
         * Naira amount intended
         * for the wallet.
         */
        amount:
          fundingAmount,

        /**
         * Kobo amount sent to
         * Paystack.
         */
        amountInKobo:
          amountInKobo,
      },
    });
  } catch (error: any) {
    console.error(
      "================================="
    );
    console.error(
      "PAYSTACK INITIALIZATION ERROR"
    );
    console.error(
      error?.response?.data ||
        error
    );
    console.error(
      "================================="
    );

    return next(
      new AppError(
        error?.response?.data?.message ||
          error?.message ||
          "Payment initialization failed",
        error?.response?.status ||
          500
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
  /**
   * Confirm endpoint is reached.
   */
  console.log(
    "🔥 VERIFY FUNDING ENDPOINT HIT"
  );

  console.log(
    "VERIFY BODY:",
    req.body
  );

  try {
    const userId =
      req.user?.id;

    if (!userId) {
      return next(
        new AppError(
          "Unauthorized",
          401
        )
      );
    }

    const { reference } =
      req.body;

    if (
      !reference ||
      typeof reference !==
        "string"
    ) {
      return next(
        new AppError(
          "Payment reference is required",
          400
        )
      );
    }

    const cleanReference =
      reference.trim();

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
    console.log(
      "VERIFYING PAYSTACK PAYMENT"
    );
    console.log(
      "Reference:",
      cleanReference
    );
    console.log(
      "User:",
      userId
    );
    console.log(
      "================================="
    );

    /**
     * ========================================
     * VERIFY WITH PAYSTACK
     * ========================================
     */
    const response =
      await paystack.get(
        `/transaction/verify/${encodeURIComponent(
          cleanReference
        )}`
      );

    console.log(
      "================================="
    );
    console.log(
      "PAYSTACK VERIFY RESPONSE"
    );
    console.log(
      JSON.stringify(
        response.data,
        null,
        2
      )
    );
    console.log(
      "================================="
    );

    const data =
      response.data;

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

    const transaction =
      data.data;

    /**
     * ========================================
     * PAYMENT STATUS
     * ========================================
     */
    if (
      transaction.status !==
      "success"
    ) {
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
    if (
      transaction.reference !==
      cleanReference
    ) {
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
    if (
      transaction.currency !==
      "NGN"
    ) {
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
    const metadata =
      transaction.metadata ||
      {};

    const paidUserId =
      metadata.userId;

    if (!paidUserId) {
      return next(
        new AppError(
          "Payment ownership could not be verified",
          400
        )
      );
    }

    if (
      String(paidUserId) !==
      String(userId)
    ) {
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
    const paidAmountKobo =
      Number(
        transaction.amount
      );

    if (
      !Number.isInteger(
        paidAmountKobo
      ) ||
      paidAmountKobo <= 0
    ) {
      return next(
        new AppError(
          "Invalid payment amount",
          400
        )
      );
    }

    const paidAmount =
      paidAmountKobo / 100;

    /**
     * Get original wallet funding
     * amount from metadata.
     */
    const fundingAmount =
      Number(
        metadata.fundingAmount
      );

    const fundingAmountKobo =
      Number(
        metadata.fundingAmountKobo
      );

    if (
      !Number.isInteger(
        fundingAmount
      ) ||
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
      !Number.isInteger(
        fundingAmountKobo
      ) ||
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
    console.log(
      "PAYMENT AMOUNT VERIFICATION"
    );
    console.log(
      "Paystack paid amount:",
      paidAmount
    );
    console.log(
      "Paystack paid Kobo:",
      paidAmountKobo
    );
    console.log(
      "Wallet funding amount:",
      fundingAmount
    );
    console.log(
      "Wallet funding Kobo:",
      fundingAmountKobo
    );
    console.log(
      "Paystack fees:",
      transaction.fees
    );
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
      Number(
        transaction.requested_amount
      );

    const amountToCompare =
      Number.isInteger(
        requestedAmountKobo
      ) &&
      requestedAmountKobo > 0
        ? requestedAmountKobo
        : paidAmountKobo;

    if (
      amountToCompare !==
      fundingAmountKobo
    ) {
      console.error(
        "PAYMENT INITIALIZED AMOUNT MISMATCH",
        {
          reference:
            cleanReference,

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
     * IMPORTANT:
     *
     * Credit ONLY the original wallet
     * funding amount.
     *
     * Do not credit Paystack's fee.
     */
    const result =
      await processWalletFunding({
        userId,

        amount:
          fundingAmount,

        gateway:
          "PAYSTACK",

        gatewayReference:
          cleanReference,

        metadata: {
          paystackData:
            transaction,

          requestedFundingAmount:
            fundingAmount,

          paystackPaidAmount:
            paidAmount,

          paystackFees:
            transaction.fees ||
            0,
        },
      });

    /**
     * ========================================
     * DUPLICATE PAYMENT
     * ========================================
     */
    if (
      result.alreadyProcessed
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Payment already processed",

        data: {
          balance:
            result.balance,

          walletBalance:
            result.balance,

          amount:
            result.transaction.amount,

          reference:
            cleanReference,

          transactionReference:
            cleanReference,

          alreadyProcessed:
            true,

          transaction:
            result.transaction,
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

      message:
        "Wallet funded successfully",

      data: {
        balance:
          result.balance,

        walletBalance:
          result.balance,

        /**
         * Amount actually credited
         * to AbuPay wallet.
         */
        amount:
          fundingAmount,

        /**
         * Amount Paystack reports
         * for the transaction.
         */
        paidAmount:
          paidAmount,

        /**
         * Paystack fee if returned.
         */
        fee:
          transaction.fees ||
          0,

        reference:
          cleanReference,

        transactionReference:
          cleanReference,

        alreadyProcessed:
          false,

        transaction:
          result.transaction,
      },
    });
  } catch (error: any) {
    console.error(
      "================================="
    );
    console.error(
      "PAYSTACK VERIFY ERROR"
    );
    console.error(
      error?.response?.data ||
        error
    );
    console.error(
      "================================="
    );

    if (
      error?.response?.data
    ) {
      return next(
        new AppError(
          error?.response?.data?.message ||
            "Payment verification failed",
          error?.response?.status ||
            400
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