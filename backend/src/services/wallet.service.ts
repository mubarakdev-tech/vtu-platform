import mongoose, { ClientSession } from "mongoose";
import Wallet from "../models/wallet.model";
import User from "../models/user.model";
import { createTransaction } from "./transaction.service";

interface DebitWalletParams {
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
 * Used for airtime/data/electricity purchases
 */
export const debitWallet = async ({
  userId,
  amount,
  session,
}: DebitWalletParams) => {

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  console.log("DEBIT WALLET USER ID:", userId);

  const wallet = session
    ? await Wallet.findOne({
        $or: [
          { user: userId },
          { userId: userId }
        ],
      }).session(session)
    : await Wallet.findOne({
        $or: [
          { user: userId },
          { userId: userId }
        ],
      });

  console.log("FOUND WALLET:", wallet);

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


/**
 * TRANSFER FUNDS
 * Transfer money from one user wallet to another
 */
export const transferFundsService = async ({
  senderId,
  recipientEmail,
  amount,
}: TransferFundsParams) => {

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

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

        recipientWallet = await Wallet.create(
          [
            {
              user: recipient._id,
              balance: 0,
            },
          ],
          { session }
        ).then((wallet) => wallet[0]);

      }



      senderWallet.balance -= amount;
      await senderWallet.save({ session });



      recipientWallet.balance += amount;
      await recipientWallet.save({ session });



      await createTransaction({
        userId: senderId,
        type: "DEBIT",
        category: "TRANSFER",
        amount,
        description: `Transfer to ${recipientEmail}`,
        metadata: {
          recipient: recipientEmail,
        },
        session,
      });



      await createTransaction({
        userId: recipient._id.toString(),
        type: "CREDIT",
        category: "TRANSFER",
        amount,
        description: "Transfer received from sender",
        metadata: {
          sender: senderId,
        },
        session,
      });



      result = {
        message: "Transfer successful",
        balance: senderWallet.balance,
      };

    });


    return result;

  } finally {

    await session.endSession();

  }
};