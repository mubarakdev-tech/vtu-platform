
import { Response } from "express";
import mongoose from "mongoose";
import Wallet from "../models/wallet.model";
import FinancialLedger from "../models/financialLedger.model";
import { createTransaction } from "../services/transaction.service";
import { createFinancialLedgerEntry } from "../services/financial-ledger.service";
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

// Admin-assisted refund for verified failed Airtime/Data purchases.
export const adminRefundTransaction = async (
  req: AuthRequest,
  res: Response
) => {
  const transactionId = String(req.params.transactionId);

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid transaction ID.",
    });
  }

  const adminId = req.user?._id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "Administrator authentication required.",
    });
  }

  const session = await mongoose.startSession();
  let result: {
    status: number;
    body: Record<string, unknown>;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      result = null;

      const original = await Transaction.findById(transactionId)
        .session(session);

      if (!original) {
        result = {
          status: 404,
          body: { success: false, message: "Transaction not found." },
        };
        return;
      }

      const metadata =
        (original.metadata || {}) as Record<string, any>;

      if (
        original.type !== "DEBIT" ||
        original.status !== "FAILED" ||
        !["AIRTIME", "DATA"].includes(original.category)
      ) {
        result = {
          status: 400,
          body: {
            success: false,
            message: "Only failed Airtime or Data debit transactions can be refunded.",
          },
        };
        return;
      }

      // Require explicit failed-purchase evidence.
      if (
        !metadata.providerResponse ||
        metadata.providerResponse.success !== false
      ) {
        result = {
          status: 400,
          body: {
            success: false,
            message: "The transaction does not contain sufficient evidence of provider failure.",
          },
        };
        return;
      }

      if (metadata.refundProcessed !== false) {
        result = {
          status: 409,
          body: {
            success: false,
            message: "Refund status is not explicitly confirmed as pending. This transaction requires manual review.",
          },
        };
        return;
      }

      // Check both the refund transaction and ledger for prior processing.
      const existingRefund = await Transaction.findOne({
        type: "CREDIT",
        category: "REFUND",
        $or: [
          { idempotencyKey: `ADMIN-REFUND-${original._id}` },
          { "metadata.originalTransactionId": String(original._id) },
          { "metadata.originalTransaction": original.reference },
        ],
      }).session(session);

      const existingLedgerRefund = await FinancialLedger.findOne({
        type: "EXPENSE",
        category: "REFUND",
        reference: {
          $in: [
            `ADMIN-REFUND-${original._id}`,
            `AIRTIME-REFUND-${original._id}`,
            `DATA-REFUND-${original._id}`,
          ],
        },
      }).session(session);

      if (existingRefund || existingLedgerRefund) {
        result = {
          status: 409,
          body: {
            success: false,
            message: "A refund record already exists. No additional credit was made.",
          },
        };
        return;
      }

      const wallet = await Wallet.findOne({
        user: String(original.user),
      }).session(session);

      if (!wallet) {
        result = {
          status: 404,
          body: {
            success: false,
            message: "Customer wallet not found.",
          },
        };
        return;
      }

      const balanceBefore = wallet.balance;
      wallet.balance += original.amount;
      await wallet.save({ session });

      const refund = await createTransaction({
        userId: String(original.user),
        type: "CREDIT",
        category: "REFUND",
        amount: original.amount,
        status: "SUCCESS",
        description: `Admin-assisted ${original.category} refund`,
        idempotencyKey: `ADMIN-REFUND-${original._id}`,
        balanceBefore,
        balanceAfter: wallet.balance,
        metadata: {
          originalTransaction: original.reference,
          originalTransactionId: String(original._id),
          refundProcessed: true,
          refundMethod: "ADMIN_ASSISTED",
          adminId: String(adminId),
        },
        session,
      });

      await createFinancialLedgerEntry({
        type: "EXPENSE",
        category: "REFUND",
        amount: original.amount,
        service: original.category,
        user: String(original.user),
        transaction: original._id,
        reference: `ADMIN-REFUND-${original._id}`,
        description: `Admin-assisted ${original.category} refund`,
        metadata: {
          originalTransaction: original.reference,
          refundTransaction: refund.reference,
          refundProcessed: true,
          refundMethod: "ADMIN_ASSISTED",
          adminId: String(adminId),
        },
        session,
      });

      original.metadata = {
        ...metadata,
        refundProcessed: true,
        refundAmount: original.amount,
        refundedAt: new Date(),
        refundMethod: "ADMIN_ASSISTED",
        refundedBy: String(adminId),
        refundTransaction: refund.reference,
      };

      await original.save({ session });

      result = {
        status: 200,
        body: {
          success: true,
          message: "Refund processed successfully.",
          refundReference: refund.reference,
          amount: original.amount,
          balanceBefore,
          balanceAfter: wallet.balance,
        },
      };
    });

    const finalResult = result as { status: number; body: Record<string, unknown> } | null;
    if (!finalResult) {
      return res.status(500).json({
        success: false,
        message: "Refund processing did not produce a result.",
      });
    }

    return res.status(finalResult.status).json(finalResult.body);
  } catch (error) {
    console.error("Admin-assisted refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process the refund. No partial refund should be assumed.",
    });
  } finally {
    await session.endSession();
  }
};
