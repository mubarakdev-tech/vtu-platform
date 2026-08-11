import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Transaction from "../models/transaction.model";

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    const filter: any = { user: userId };

    if (status && ["PENDING", "SUCCESS", "FAILED"].includes(status)) {
      filter.status = status;
    }

    if (
      category &&
      [
        "WALLET_FUNDING",
        "TRANSFER",
        "AIRTIME",
        "DATA",
        "CABLE",
        "ELECTRICITY",
        "REFUND",
      ].includes(category)
    ) {
      filter.category = category;
    }

    if (type && ["CREDIT", "DEBIT"].includes(type)) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      transactions,
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};