import { Request, Response } from "express";
import Wallet from "../models/wallet.model";
import { createTransaction } from "../services/transaction.service";
import { transferFundsService } from "../services/wallet.service";

interface AuthRequest extends Request {
  user?: string;
}

/**
 * FUND WALLET
 */
export const fundWallet = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user;
    const { amount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    let wallet = await Wallet.findOne({
      user: userId,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
      });
    }

    wallet.balance += Number(amount);

    await wallet.save();

    // Create transaction record
    await createTransaction({
      userId,
      type: "CREDIT",
      category: "WALLET_FUNDING",
      amount: Number(amount),
      description: "Wallet funded successfully",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      balance: wallet.balance,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET WALLET BALANCE
 */
export const getWalletBalance = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let wallet = await Wallet.findOne({
      user: userId,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
      });
    }

    return res.status(200).json({
      success: true,
      balance: wallet.balance,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * TRANSFER FUNDS
 */
export const transferFunds = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { email, amount } = req.body;

    const result = await transferFundsService({
      senderId: userId,
      recipientEmail: email,
      amount: Number(amount),
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};