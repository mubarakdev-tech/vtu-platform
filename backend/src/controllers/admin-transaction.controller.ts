
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAdminTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = Math.max(
      1,
      parseInt(String(req.query.page || "1"), 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20)
    );

    const filter: Record<string, any> = {};
    const status = String(req.query.status || "").toUpperCase();
    const category = String(req.query.category || "").toUpperCase();
    const type = String(req.query.type || "").toUpperCase();
    const search = String(req.query.search || "").trim();

    if (["PENDING", "SUCCESS", "FAILED"].includes(status)) {
      filter.status = status;
    }

    if (
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

    if (["CREDIT", "DEBIT"].includes(type)) {
      filter.type = type;
    }

    if (req.query.from || req.query.to) {
      const createdAt: Record<string, Date> = {};

      if (req.query.from) {
        const from = new Date(String(req.query.from));
        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }
        createdAt.$gte = from;
      }

      if (req.query.to) {
        const to = new Date(String(req.query.to));
        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to))) {
          to.setHours(23, 59, 59, 999);
        }
        createdAt.$lte = to;
      }

      filter.createdAt = createdAt;
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await User.find({
        $or: [
          { name: pattern },
          { email: pattern },
          { phone: pattern },
        ],
      })
        .select("_id")
        .limit(500)
        .lean();

      filter.$or = [
        { reference: pattern },
        { gatewayReference: pattern },
        { description: pattern },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    console.error("Admin transaction list error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admin transactions.",
    });
  }
};
