import mongoose from "mongoose";
import AppError from "../utils/apperror";

import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";

interface PurchaseDataPayload {
  userId: string;
  network: string;
  phone: string;
  plan: string;
  amount: number;
}

export const purchaseData = async ({
  userId,
  network,
  phone,
  plan,
  amount,
}: PurchaseDataPayload) => {
  if (!amount || amount <= 0) {
    throw new AppError("Invalid data amount", 400);
  }

  const session = await mongoose.startSession();

  try {
    let result: any;

    await session.withTransaction(async () => {
      // Debit wallet first
      const wallet = await debitWallet({
        userId,
        amount,
        session,
      });

      // Purchase data from VTpass
      const providerResponse = await vtpassProvider.buyData({
        network,
        phone,
        plan,
        amount,
      });

      // Roll back transaction if VTpass failed
      if (!providerResponse.success) {
        throw new AppError(providerResponse.message, 400);
      }

      // Record successful transaction
      const transaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "DATA",
        amount,
        status: "SUCCESS",
        description: `${network} Data Purchase`,
        metadata: {
          network,
          phone,
          plan,
          providerResponse,
        },
        session,
      });

      result = {
        success: true,
        message: "Data purchase successful",
        walletBalance: wallet.balance,
        transaction,
        providerResponse,
      };
    });

    if (!result) {
      throw new AppError("Data purchase failed", 500);
    }

    return result;
  } finally {
    await session.endSession();
  }
};