import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

import Wallet from "../models/wallet.model";
import Transaction from "../models/transaction.model";
import AppError from "../utils/apperror";

export const purchaseAirtime = async (
  userId: string,
  network: string,
  phone: string,
  amount: number
) => {
  if (!amount || amount <= 0) {
    throw new AppError("Invalid airtime amount", 400);
  }

  const session = await mongoose.startSession();

  try {
    let response: any;

    await session.withTransaction(async () => {
      // Find wallet
      const wallet = await Wallet.findOne({ user: userId }).session(session);

      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      // Check balance
      if (wallet.balance < amount) {
        throw new AppError("Insufficient wallet balance", 400);
      }

      // Debit wallet
      wallet.balance -= amount;
      await wallet.save({ session });

      // Create transaction
      const transaction = await Transaction.create(
        [
          {
            user: userId,
            reference: uuidv4(),
            type: "DEBIT",
            category: "AIRTIME",
            amount,
            status: "SUCCESS", // Later this becomes PENDING when integrating a real provider
            description: `${network} Airtime Purchase`,
            metadata: {
              network,
              phone,
            },
          },
        ],
        { session }
      );

      response = {
        success: true,
        message: "Airtime purchase successful",
        walletBalance: wallet.balance,
        transaction: transaction[0],
      };
    });

    if (!response) {
      throw new AppError("Airtime purchase failed", 500);
    }

    return response;
  } finally {
    await session.endSession();
  }
};