import { Response } from "express";
import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";
import FinancialLedger from "../models/financialLedger.model";
import { AuthRequest } from "../middleware/auth.middleware";

// ==========================
// GET DASHBOARD
// ==========================
export const getDashboard = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ==========================================
    // GET AUTHENTICATED USER
    // ==========================================

    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==========================================
    // WALLET
    // ==========================================

    const wallet =
      await Wallet.findOne({
        user: userId,
      });

    // ==========================================
    // RECENT CUSTOMER TRANSACTIONS
    // ==========================================

    const transactions =
      await Transaction.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(5);

    // ==========================================
    // TRANSACTION STATISTICS
    // ==========================================

    const totalTransactions =
      await Transaction.countDocuments({
        user: userId,
      });

    const successfulTransactions =
      await Transaction.countDocuments({
        user: userId,
        status: {
          $in: [
            "SUCCESS",
            "success",
          ],
        },
      });

    const failedTransactions =
      await Transaction.countDocuments({
        user: userId,
        status: {
          $in: [
            "FAILED",
            "failed",
          ],
        },
      });

    // ==========================================
    // FINANCIAL LEDGER
    // ==========================================
    //
    // This is AbuPay's business accounting data.
    //
    // IMPORTANT:
    //
    // These figures are NOT wallet balance.
    //
    // They represent:
    //
    // Airtime/Data sales
    // Provider costs
    // Gross profit
    //
    // ==========================================

    const ledgerEntries =
      await FinancialLedger.find({
        user: userId,
      }).lean();

    // ==========================================
    // AIRTIME SALES
    // ==========================================

    const airtimeSales =
      ledgerEntries
        .filter(
          (entry) =>
            entry.category ===
              "AIRTIME_SALE" &&
            entry.type ===
              "REVENUE"
        )
        .reduce(
          (
            total,
            entry
          ) =>
            total +
            (entry.customerAmount ||
              entry.amount ||
              0),
          0
        );

    // ==========================================
    // DATA SALES
    // ==========================================

    const dataSales =
      ledgerEntries
        .filter(
          (entry) =>
            entry.category ===
              "DATA_SALE" &&
            entry.type ===
              "REVENUE"
        )
        .reduce(
          (
            total,
            entry
          ) =>
            total +
            (entry.customerAmount ||
              entry.amount ||
              0),
          0
        );

    // ==========================================
    // TOTAL CUSTOMER SALES
    // ==========================================

    const totalSales =
      airtimeSales +
      dataSales;

    // ==========================================
    // PROVIDER COST
    // ==========================================
    //
    // Currently this may be 0 because we have
    // not configured the real VTpass margin yet.
    //
    // Once providerCost exists in the ledger,
    // it will automatically be included.
    // ==========================================

    const providerCost =
      ledgerEntries.reduce(
        (
          total,
          entry
        ) =>
          total +
          (entry.providerCost ||
            0),
        0
      );

    // ==========================================
    // GROSS PROFIT
    // ==========================================

    const grossProfit =
      ledgerEntries.reduce(
        (
          total,
          entry
        ) =>
          total +
          (entry.grossProfit ||
            0),
        0
      );

    // ==========================================
    // RETURN DASHBOARD
    // ==========================================

    return res.status(200).json({
      success: true,

      walletBalance:
        wallet?.balance || 0,

      stats: {
        totalTransactions,

        successfulTransactions,

        failedTransactions,

        referralEarnings: 0,
      },

      // ========================================
      // BUSINESS FINANCIALS
      // ========================================

      financials: {
        airtimeSales,

        dataSales,

        totalSales,

        providerCost,

        grossProfit,

        profitAvailable:
          ledgerEntries.some(
            (entry) =>
              entry.grossProfit !==
                undefined &&
              entry.grossProfit !==
                null
          ),
      },

      // ========================================
      // RECENT TRANSACTIONS
      // ========================================

      recentTransactions:
        transactions,

      // ========================================
      // ANNOUNCEMENTS
      // ========================================

      announcements: [
        {
          id: 1,

          title:
            "Welcome to AbuPay",

          message:
            "Buy Airtime, Data and Pay Bills instantly.",
        },
      ],

      // ========================================
      // PROMOTIONS
      // ========================================

      promotions: [
        {
          title:
            "Weekend Promo",

          description:
            "Get 2% cashback on MTN Data.",
        },
      ],
    });

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Dashboard error",
    });
  }
};
