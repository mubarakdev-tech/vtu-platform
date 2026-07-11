import mongoose from "mongoose";
import { vtpassProvider } from "../providers/vtpass/vtpass.client";
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
  const session = await mongoose.startSession();

  try {
    let result: any;

    await session.withTransaction(async () => {
      // 1. Debit wallet
      const wallet = await debitWallet({
        userId,
        amount,
        session,
      });

      // 2. Purchase data from provider
      const providerResponse = await vtpassProvider.buyData({
        network,
        phone,
        plan,
        amount,
      });

      // 3. Record transaction
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

    return result;
  } finally {
    await session.endSession();
  }
};