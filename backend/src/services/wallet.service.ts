import { ClientSession } from "mongoose";
import Wallet from "../models/wallet.model";
import AppError from "../utils/AppError";

interface DebitWalletPayload {
  userId: string;
  amount: number;
  session?: ClientSession;
}

interface CreditWalletPayload {
  userId: string;
  amount: number;
  session?: ClientSession;
}

/**
 * ==========================================
 * GET USER WALLET
 * ==========================================
 */
export const getWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({
    user: userId,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
      balance: 0,
    });
  }

  return wallet;
};

/**
 * ==========================================
 * DEBIT WALLET
 * ==========================================
 */
export const debitWallet = async ({
  userId,
  amount,
  session,
}: DebitWalletPayload) => {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new AppError(
      "Invalid amount",
      400
    );
  }

  const wallet =
    await Wallet.findOne({
      user: userId,
    }).session(
      session || null
    );

  if (!wallet) {
    throw new AppError(
      "Wallet not found",
      404
    );
  }

  if (
    wallet.balance < amount
  ) {
    throw new AppError(
      "Insufficient wallet balance",
      400
    );
  }

  const balanceBefore =
    wallet.balance;

  wallet.balance -= amount;

  const balanceAfter =
    wallet.balance;

  await wallet.save({
    session,
  });

  return {
    wallet,
    balanceBefore,
    balanceAfter,
  };
};

/**
 * ==========================================
 * CREDIT WALLET
 * ==========================================
 */
export const creditWallet = async ({
  userId,
  amount,
  session,
}: CreditWalletPayload) => {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new AppError(
      "Invalid amount",
      400
    );
  }

  let wallet =
    await Wallet.findOne({
      user: userId,
    }).session(
      session || null
    );

  let balanceBefore = 0;

  /**
   * ========================================
   * CREATE WALLET IF MISSING
   * ========================================
   *
   * We deliberately use new Wallet()
   * instead of Wallet.create() here.
   *
   * This avoids Mongoose's overloaded
   * create() TypeScript type returning
   * an array when options/session are used.
   */
  if (!wallet) {
    wallet = new Wallet({
      user: userId,
      balance: amount,
    });

    balanceBefore = 0;

    await wallet.save({
      session,
    });
  } else {
    /**
     * Existing wallet.
     */
    balanceBefore =
      wallet.balance;

    wallet.balance += amount;

    await wallet.save({
      session,
    });
  }

  /**
   * Wallet is guaranteed to exist here.
   */
  const balanceAfter =
    wallet.balance;

  return {
    wallet,
    balanceBefore,
    balanceAfter,
  };
};