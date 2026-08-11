import { Response } from "express";
import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";
import { AuthRequest } from "../middleware/auth.middleware";

// ==========================
// GET DASHBOARD
// ==========================
export const getDashboard = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const wallet = await Wallet.findOne({
      user: userId,
    });

    const transactions = await Transaction.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalTransactions =
      await Transaction.countDocuments({
        user: userId,
      });

    const successfulTransactions =
      await Transaction.countDocuments({
        user: userId,
        status: "success",
      });

    const failedTransactions =
      await Transaction.countDocuments({
        user: userId,
        status: "failed",
      });

    return res.status(200).json({
      success: true,

      walletBalance: wallet?.balance || 0,

      stats: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        referralEarnings: 0,
      },

      recentTransactions: transactions,

      announcements: [
        {
          id: 1,
          title: "Welcome to AbuPay",
          message:
            "Buy Airtime, Data and Pay Bills instantly.",
        },
      ],

      promotions: [
        {
          title: "Weekend Promo",
          description:
            "Get 2% cashback on MTN Data.",
        },
      ],
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Dashboard error",
    });
  }
};