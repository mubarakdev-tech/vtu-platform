import mongoose from "mongoose";
import AppError from "../utils/apperror";

import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import {
  debitWallet,
  creditWallet,
} from "./wallet.service";
import { createTransaction } from "./transaction.service";

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

    console.log("\n======================================");
    console.log("AIRTIME PURCHASE STARTED");
    console.log("User ID :", userId);
    console.log("Network :", network);
    console.log("Phone   :", phone);
    console.log("Amount  :", amount);
    console.log("======================================\n");

    await session.withTransaction(async () => {

      // Debit wallet
      const wallet = await debitWallet({
        userId,
        amount,
        session,
      });

      console.log("✅ Wallet debited successfully");

      // Send request to VTpass
      const providerResponse =
        await vtpassProvider.buyAirtime({
          network,
          phone,
          amount,
        });

      console.log("========== VTPASS RESPONSE ==========");
      console.log(JSON.stringify(providerResponse, null, 2));
      console.log("=====================================");

      // Refund wallet if VTpass fails
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
          category: "AIRTIME",
          amount,
          status: "FAILED",
          description: `${network.toUpperCase()} Airtime Refund`,
          metadata: {
            network,
            phone,
            providerResponse,
          },
          session,
        });

        throw new AppError(
          providerResponse.message,
          400
        );
      }

      console.log("✅ VTpass purchase successful");

      // Record successful transaction
      const transaction =
        await createTransaction({
          userId,
          type: "DEBIT",
          category: "AIRTIME",
          amount,
          status: "SUCCESS",
          description: `${network.toUpperCase()} Airtime Purchase`,
          metadata: {
            network,
            phone,
            providerResponse,
          },
          session,
        });

      console.log("✅ Transaction saved");

      response = {
        success: true,
        message: "Airtime purchase successful",
        walletBalance: wallet.balance,
        transaction,
        providerResponse,
      };

    });

    if (!response) {
      throw new AppError(
        "Airtime purchase failed",
        500
      );
    }

    return response;

  } finally {

    await session.endSession();

    console.log("========== AIRTIME PURCHASE ENDED ==========\n");

  }

};