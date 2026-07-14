import mongoose from "mongoose";

import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";
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
      // 1. Debit wallet
      const wallet = await debitWallet({
        userId,
        amount,
        session,
      });

      // 2. Call VTpass
      const providerResponse = await vtpassProvider.buyAirtime({
        network,
        phone,
        amount,
      });

      // 3. Stop immediately if VTpass failed
      if (!providerResponse.success) {
        throw new AppError(providerResponse.message, 400);
      }

      // 4. Record successful transaction
      const transaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "AIRTIME",
        amount,
        status: "SUCCESS",
        description: `${network} Airtime Purchase`,
        metadata: {
          network,
          phone,
          providerResponse,
        },
        session,
      });

      response = {
        success: true,
        message: "Airtime purchase successful",
        walletBalance: wallet.balance,
        transaction,
        providerResponse,
      };
    });

    if (!response) {
      throw new AppError("Airtime purchase failed", 500);
    }

    return response;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};