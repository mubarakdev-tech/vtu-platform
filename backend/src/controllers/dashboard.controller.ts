import { Response } from "express";
import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";

export const getDashboard = async (
  req: any,
  res: Response
) => {
  try {
    const userId = req.user;

    // Wallet
    const wallet = await Wallet.findOne({
      user: userId,
    });

    // All Transactions
    const transactions = await Transaction.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    // Statistics
    const totalTransactions = transactions.length;

    const successfulTransactions =
      transactions.filter(
        (t) => t.status === "SUCCESS"
      ).length;

    const failedTransactions =
      transactions.filter(
        (t) => t.status === "FAILED"
      ).length;

    const totalSpent = transactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);

    return res.status(200).json({
      success: true,

      walletBalance: wallet?.balance || 0,

      totalTransactions,

      successfulTransactions,

      failedTransactions,

      totalSpent,

      recentTransactions:
        transactions.slice(0, 10),
    });

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};