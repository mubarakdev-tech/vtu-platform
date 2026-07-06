import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/User";

export const getWallet = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    walletBalance: req.user.walletBalance,
    user: req.user.name,
  });
};

export const fundWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.walletBalance += Number(amount);

    await user.save();

    res.json({
      success: true,
      message: "Wallet funded successfully",
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};