import mongoose, { ClientSession } from "mongoose";
import Wallet from "../models/wallet.model";

interface DebitWalletParams {
  userId: string;
  amount: number;
  session?: ClientSession;
}

export const debitWallet = async ({
  userId,
  amount,
  session,
}: DebitWalletParams) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const wallet = await Wallet.findOne({ user: userId }).session(session || null);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;

  await wallet.save({ session });

  return wallet;
};