import mongoose from "mongoose";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import { createTransaction } from "./transaction.service";

interface TransferParams {
  senderId: string;
  recipientEmail: string;
  amount: number;
}

export const transferFundsService = async ({
  senderId,
  recipientEmail,
  amount,
}: TransferParams) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid transfer amount");
  }

  const session = await mongoose.startSession();

  try {
    let response: any;

    await session.withTransaction(async () => {
      // Find sender
      const sender = await User.findById(senderId).session(session);

      if (!sender) {
        throw new Error("Sender not found");
      }

      // Find recipient
      const recipient = await User.findOne({
        email: recipientEmail.toLowerCase(),
      }).session(session);

      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Prevent self-transfer
      if (sender._id.toString() === recipient._id.toString()) {
        throw new Error("You cannot transfer to yourself");
      }

      // Get sender wallet
      let senderWallet = await Wallet.findOne({
        user: sender._id,
      }).session(session);

      if (!senderWallet) {
        senderWallet = await Wallet.create(
          [
            {
              user: sender._id,
              balance: 0,
            },
          ],
          { session }
        ).then((docs) => docs[0]);
      }

      // Get recipient wallet
      let recipientWallet = await Wallet.findOne({
        user: recipient._id,
      }).session(session);

      if (!recipientWallet) {
        recipientWallet = await Wallet.create(
          [
            {
              user: recipient._id,
              balance: 0,
            },
          ],
          { session }
        ).then((docs) => docs[0]);
      }

      // Check balance
      if (senderWallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      // Debit sender
      senderWallet.balance -= amount;
      await senderWallet.save({ session });

      // Credit recipient
      recipientWallet.balance += amount;
      await recipientWallet.save({ session });

      // Sender transaction
      await createTransaction({
        userId: sender._id.toString(),
        type: "DEBIT",
        category: "TRANSFER",
        amount,
        description: `Transfer to ${recipient.email}`,
        metadata: {
          recipient: recipient.email,
        },
        session,
      });

      // Recipient transaction
      await createTransaction({
        userId: recipient._id.toString(),
        type: "CREDIT",
        category: "TRANSFER",
        amount,
        description: `Transfer from ${sender.email}`,
        metadata: {
          sender: sender.email,
        },
        session,
      });

      response = {
        message: "Transfer successful",
        balance: senderWallet.balance,
      };
    });

    return response;
  } finally {
    await session.endSession();
  }
};