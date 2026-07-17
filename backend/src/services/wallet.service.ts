import mongoose, { ClientSession } from "mongoose";
import Wallet from "../models/wallet.model";
import User from "../models/user.model";
import { createTransaction } from "./transaction.service";

interface WalletParams {
  userId: string;
  amount: number;
  session?: ClientSession;
}

interface TransferFundsParams {
  senderId: string;
  recipientEmail: string;
  amount: number;
}

/**
 * DEBIT WALLET
 */
export const debitWallet = async ({
  userId,
  amount,
  session,
}: WalletParams) => {

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  console.log("======== DEBIT WALLET ========");
  console.log("User:", userId);
  console.log("Amount:", amount);

  const wallet = session
    ? await Wallet.findOne({ user: userId }).session(session)
    : await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  console.log("Current Balance:", wallet.balance);

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;

  await wallet.save({ session });

  console.log("New Balance:", wallet.balance);

  return wallet;
};

/**
 * CREDIT WALLET
 */
export const creditWallet = async ({
  userId,
  amount,
  session,
}: WalletParams) => {

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const wallet = session
    ? await Wallet.findOne({ user: userId }).session(session)
    : await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  wallet.balance += amount;

  await wallet.save({ session });

  return wallet;
};

/**
 * TRANSFER FUNDS
 */
export const transferFundsService = async ({
  senderId,
  recipientEmail,
  amount,
}: TransferFundsParams) => {

  const session = await mongoose.startSession();

  try {

    let result: any;

    await session.withTransaction(async () => {

      const senderWallet = await Wallet.findOne({
        user: senderId,
      }).session(session);

      if (!senderWallet) {
        throw new Error("Sender wallet not found");
      }

      if (senderWallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      const recipient = await User.findOne({
        email: recipientEmail.toLowerCase(),
      });

      if (!recipient) {
        throw new Error("Recipient not found");
      }

      let recipientWallet = await Wallet.findOne({
        user: recipient._id,
      }).session(session);

      if (!recipientWallet) {

        recipientWallet = (
          await Wallet.create(
            [
              {
                user: recipient._id,
                balance: 0,
              },
            ],
            { session }
          )
        )[0];

      }

      senderWallet.balance -= amount;
      recipientWallet.balance += amount;

      await senderWallet.save({ session });
      await recipientWallet.save({ session });

      await createTransaction({
        userId: senderId,
        type: "DEBIT",
        category: "TRANSFER",
        amount,
        description: `Transfer to ${recipientEmail}`,
        session,
      });

      await createTransaction({
        userId: recipient._id.toString(),
        type: "CREDIT",
        category: "TRANSFER",
        amount,
        description: `Transfer from ${senderId}`,
        session,
      });

      result = {
        success: true,
        message: "Transfer successful",
        balance: senderWallet.balance,
      };

    });

    return result;

  } finally {

    await session.endSession();

  }

};