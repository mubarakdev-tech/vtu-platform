import mongoose from "mongoose";
import AppError from "../utils/apperror";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet, creditWallet } from "./wallet.service";
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
    let response: any;

    console.log("\n======================================");
    console.log("DATA PURCHASE STARTED");
    console.log("User ID :", userId);
    console.log("Network :", network);
    console.log("Phone   :", phone);
    console.log("Plan    :", plan);
    console.log("Amount  :", amount);
    console.log("======================================\n");

    await session.withTransaction(async () => {
      // 1. Debit wallet
      const wallet = await debitWallet({
        userId,
        amount,
        session,
      });

      console.log("✅ Wallet debited successfully");

      // 2. Call VTpass
      const providerResponse = await vtpassProvider.buyData({
        network: network.toLowerCase(),
        phone: phone.trim(),
        plan,
        amount,
      });

      console.log("========== VTPASS DATA RESPONSE ==========");
      console.log(JSON.stringify(providerResponse, null, 2));
      console.log("==========================================");

      // 3. If VTpass failed → Refund
      if (!providerResponse.success) {
        console.log("❌ VTpass failed. Refunding wallet...");

        await creditWallet({
          userId,
          amount,
          session,
        });

        console.log("✅ Wallet refunded successfully");

        await createTransaction({
          userId,
          type: "CREDIT",
          category: "DATA",
          amount,
          status: "FAILED",
          description: `${network.toUpperCase()} Data Refund`,
          metadata: {
            network,
            phone,
            plan,
            providerResponse,
          },
          session,
        });

        throw new AppError(
          providerResponse.message || "Data purchase failed",
          400
        );
      }

      console.log("✅ VTpass data purchase successful");

      // 4. Record successful transaction
      const transaction = await createTransaction({
        userId,
        type: "DEBIT",
        category: "DATA",
        amount,
        status: "SUCCESS",
        description: `${network.toUpperCase()} Data Purchase`,
        metadata: {
          network,
          phone,
          plan,
          providerResponse,
        },
        session,
      });

      console.log("✅ Transaction saved");

      response = {
        success: true,
        message: "Data purchase successful",
        walletBalance: wallet.balance,
        transaction,
        providerResponse,
      };
    });

    if (!response) {
      throw new AppError("Data purchase failed", 500);
    }

    return response;
  } finally {
    await session.endSession();
    console.log("========== DATA PURCHASE ENDED ==========\n");
  }
};