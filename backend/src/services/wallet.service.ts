import mongoose, { ClientSession } from "mongoose";
import Wallet from "../models/wallet.model";
import AppError from "../utils/apperror";

interface DebitWalletPayload {
  userId: string;
  amount: number;
  session?: ClientSession;
}

interface CreditWalletPayload {
  userId: string;
  amount: number;
  session?: ClientSession;
}

/**
 * Get user wallet
 */
export const getWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
      balance: 0,
    });
  }

  return wallet;
};

/**
 * Debit wallet
 */
export const debitWallet = async ({
  userId,
  amount,
  session,
}: DebitWalletPayload) => {
  if (amount <= 0) {
    throw new AppError("Invalid amount", 400);
  }

  const wallet = await Wallet.findOne({ user: userId }).session(session || null);

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  if (wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  wallet.balance -= amount;
  await wallet.save({ session });

  return wallet;
};

/**
 * Credit wallet
 */
export const creditWallet = async ({
  userId,
  amount,
  session,
}: CreditWalletPayload) => {
  if (amount <= 0) {
    throw new AppError("Invalid amount", 400);
  }

  let wallet = await Wallet.findOne({ user: userId }).session(session || null);

  if (!wallet) {
    wallet = await Wallet.create(
      [
        {
          user: userId,
          balance: amount,
        },
      ],
      { session }
    ).then((docs) => docs[0]);
  } else {
    wallet.balance += amount;
    await wallet.save({ session });
  }

  return wallet;
};