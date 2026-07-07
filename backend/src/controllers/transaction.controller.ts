import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Transaction from "../models/transaction.model";

export const getTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};