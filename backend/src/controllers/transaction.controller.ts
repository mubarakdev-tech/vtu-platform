import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Transaction from "../models/Transaction";

export const getTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};