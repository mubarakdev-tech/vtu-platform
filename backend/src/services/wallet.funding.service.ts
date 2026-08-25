import mongoose from "mongoose";
import Wallet from "../models/wallet.model";
import {
  createTransaction,
  findTransactionByGatewayReference,
} from "./transaction.service";
import AppError from "../utils/AppError";

interface ProcessWalletFundingParams {
  userId: string;
  amount: number;
  gateway: "PAYSTACK" | "OTHER";
  gatewayReference: string;
  metadata?: Record<string, any>;
}

/**
 * Process a successful wallet funding transaction.
 *
 * This operation:
 * 1. Prevents duplicate gateway payments
 * 2. Credits the wallet
 * 3. Creates the financial transaction
 * 4. Commits both operations atomically
 *
 * If anything fails, the entire operation is rolled back.
 */
export const processWalletFunding = async ({
  userId,
  amount,
  gateway,
  gatewayReference,
  metadata = {},
}: ProcessWalletFundingParams) => {
  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  if (!amount || amount <= 0) {
    throw new AppError("Invalid funding amount", 400);
  }

  if (!gatewayReference) {
    throw new AppError("Gateway reference is required", 400);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /**
     * Check whether this exact gateway payment
     * has already been processed.
     */
    const existingTransaction =
      await findTransactionByGatewayReference(
        gateway,
        gatewayReference,
        session
      );

    if (existingTransaction) {
      await session.abortTransaction();

      return {
        alreadyProcessed: true,
        transaction: existingTransaction,
        balance: existingTransaction.balanceAfter,
      };
    }

    /**
     * Get wallet inside the transaction session.
     */
    let wallet = await Wallet.findOne({
      user: userId,
    }).session(session);

    if (!wallet) {
      const wallets = await Wallet.create(
        [
          {
            user: userId,
            balance: 0,
          },
        ],
        { session }
      );

      wallet = wallets[0];
    }

    /**
     * Capture balance before funding.
     */
    const balanceBefore = wallet.balance;

    /**
     * Credit wallet.
     */
    wallet.balance += amount;

    const balanceAfter = wallet.balance;

    await wallet.save({ session });

    /**
     * Create financial transaction.
     */
    const transaction = await createTransaction({
      userId,
      type: "CREDIT",
      category: "WALLET_FUNDING",
      amount,
      status: "SUCCESS",
      description: `Wallet Funding via ${gateway}`,
      balanceBefore,
      balanceAfter,
      gateway,
      gatewayReference,
      metadata,
      session,
    });

    /**
     * Commit wallet + transaction together.
     */
    await session.commitTransaction();

    return {
      alreadyProcessed: false,
      wallet,
      transaction,
      balance: balanceAfter,
    };
  } catch (error) {
    /**
     * Roll back everything if anything failed.
     */
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};
