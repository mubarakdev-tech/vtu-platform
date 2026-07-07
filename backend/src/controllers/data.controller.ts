import { debitWallet } from "../services/transaction.service";
import { createTransaction } from "../services/transaction.service";

export const buyData = async (req: any, res: any) => {
  try {
    const userId = req.user;
    const { network, phone, plan, amount } = req.body;

    // 1. validate input
    if (!network || !phone || !plan || !amount) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2. debit wallet first (critical)
    await debitWallet({
      userId,
      amount,
      category: "DATA_PURCHASE",
      meta: { network, phone, plan },
    });

    // 3. simulate provider response (real API comes later)
    const providerResponse = {
      status: "success",
      message: "Data sent successfully",
      reference: `DATA-${Date.now()}`,
    };

    // 4. log transaction
    const transaction = await createTransaction({
      userId,
      type: "DEBIT",
      amount,
      category: "DATA_PURCHASE",
      meta: {
        network,
        phone,
        plan,
        providerResponse,
      },
    });

    return res.status(200).json({
      message: "Data purchase successful",
      network,
      phone,
      plan,
      amount,
      transaction,
      walletBalance: null, // optional later if you want
      providerResponse,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Data purchase failed",
    });
  }
};