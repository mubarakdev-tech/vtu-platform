import { Request, Response } from "express";
import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const wallet = await Wallet.findOne({ user: userId });

    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalTransactions = await Transaction.countDocuments({
      user: userId,
    });

    const successfulTransactions = await Transaction.countDocuments({
      user: userId,
      status: "success",
    });

    const failedTransactions = await Transaction.countDocuments({
      user: userId,
      status: "failed",
    });

    res.json({
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
          message: "Buy Airtime, Data and Pay Bills instantly.",
        },
      ],

      promotions: [
        {
          title: "Weekend Promo",
          description: "Get 2% cashback on MTN Data.",
        },
      ],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Dashboard error",
    });
  }
};