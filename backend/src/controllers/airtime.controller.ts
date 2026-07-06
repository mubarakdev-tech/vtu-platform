import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/User";

export const buyAirtime = async (req: AuthRequest, res: Response) => {
  try {
    const { network, phone, amount } = req.body;

    if (!network || !phone || !amount) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    // Deduct wallet balance
    user.walletBalance -= Number(amount);

    await user.save();

    res.json({
      success: true,
      message: "Airtime purchase successful",
      network,
      phone,
      amount,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};