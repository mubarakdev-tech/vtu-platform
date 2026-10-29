import { Request, Response, NextFunction } from "express";
import FinancialLedger from "../models/financialLedger.model";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import AppError from "../utils/AppError";

export const getFinancialSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const filter: Record<string, any> = {
      "metadata.isTest": { $ne: true },
    };

    const isValidDate = (value: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
      new Date(`${value}T00:00:00.000Z`)
        .toISOString()
        .startsWith(value);

    if (from && !isValidDate(from)) {
      return next(new AppError("Invalid from date", 400));
    }

    if (to && !isValidDate(to)) {
      return next(new AppError("Invalid to date", 400));
    }

    if (from && to && from > to) {
      return next(
        new AppError("The from date must not be after the to date", 400)
      );
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
      }

      if (to) {
        filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    const entries: any[] = await FinancialLedger.find(filter).lean();

    // Current production customer wallet funds.
    // Test accounts are excluded from this financial control figure.
    const productionUsers = await User.find({
      role: "user",
      isTest: { $ne: true },
    })
      .select("_id")
      .lean();

    const productionUserIds = productionUsers.map(
      (user) => user._id
    );

    const productionWallets = await Wallet.find({
      user: { $in: productionUserIds },
    })
      .select("balance")
      .lean();

    const customerWalletFunds = productionWallets.reduce(
      (total, wallet) => total + Number(wallet.balance || 0),
      0
    );

    // Successful service sales recorded as revenue.
    const sales = entries.filter(
      (entry) =>
        entry.type === "REVENUE" &&
        ["AIRTIME_SALE", "DATA_SALE"].includes(entry.category)
    );

    const revenueEntries = entries.filter(
      (entry) =>
        entry.type === "REVENUE" &&
        ["AIRTIME_SALE", "DATA_SALE", "OTHER_REVENUE"].includes(
          entry.category
        )
    );

    // All recorded expenses, including Paystack fees.
    const expenses = entries.filter(
      (entry) => entry.type === "EXPENSE"
    );

    const providerExpenseEntries = expenses.filter(
      (entry) => entry.category === "PROVIDER_COST"
    );

    const paystackFeeEntries = expenses.filter(
      (entry) => entry.category === "PAYSTACK_FEE"
    );

    const otherExpenseEntries = expenses.filter(
      (entry) =>
        !["PROVIDER_COST", "PAYSTACK_FEE"].includes(entry.category)
    );

    const sumAmounts = (items: any[]) =>
      items.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const airtimeEntries = sales.filter(
      (entry) => entry.category === "AIRTIME_SALE"
    );

    const dataEntries = sales.filter(
      (entry) => entry.category === "DATA_SALE"
    );

    // Index provider-cost expense entries by linked sale transaction.
    const expensesByTransaction = new Map<string, any[]>();

    for (const expense of providerExpenseEntries) {
      if (!expense.transaction) continue;

      const key = String(expense.transaction);
      const linked = expensesByTransaction.get(key) || [];

      linked.push(expense);
      expensesByTransaction.set(key, linked);
    }

    let totalProviderCost = 0;
    let knownCostSales = 0;
    let unknownCostSales = 0;

    const consumedProviderExpenseIds = new Set<string>();

    for (const sale of sales) {
      const saleTransactionId = sale.transaction
        ? String(sale.transaction)
        : "";

      const linkedExpenses = saleTransactionId
        ? expensesByTransaction.get(saleTransactionId) || []
        : [];

      const metadata = sale.metadata || {};

      const directCostIsKnown =
        typeof sale.providerCost === "number" &&
        Number.isFinite(sale.providerCost) &&
        sale.providerCost >= 0;

      const metadataCost = Number(metadata.providerCost);

      const metadataCostIsKnown =
        metadata.providerCostKnown === true &&
        Number.isFinite(metadataCost) &&
        metadataCost >= 0;

      if (directCostIsKnown || metadataCostIsKnown) {
        const cost = directCostIsKnown
          ? sale.providerCost
          : metadataCost;

        totalProviderCost += cost;
        knownCostSales += 1;

        // Avoid counting the same sale cost twice.
        for (const expense of linkedExpenses) {
          consumedProviderExpenseIds.add(String(expense._id));
        }
      } else if (linkedExpenses.length > 0) {
        totalProviderCost += sumAmounts(linkedExpenses);
        knownCostSales += 1;

        for (const expense of linkedExpenses) {
          consumedProviderExpenseIds.add(String(expense._id));
        }
      } else {
        // Never assume an unrecorded provider cost is zero.
        unknownCostSales += 1;
      }
    }

    // Include provider-cost entries not already attributed to a sale.
    const unlinkedProviderExpenses = providerExpenseEntries.filter(
      (expense) =>
        !consumedProviderExpenseIds.has(String(expense._id))
    );

    totalProviderCost += sumAmounts(unlinkedProviderExpenses);

    const totalRevenue = sumAmounts(revenueEntries);
    const otherExpenses = sumAmounts(otherExpenseEntries);
    const totalPaystackFees = sumAmounts(paystackFeeEntries);

    // Includes recorded provider costs, Paystack fees and other expenses.
    const totalExpenses =
      totalProviderCost + otherExpenses + totalPaystackFees;

    // Arithmetic based only on currently recorded amounts.
    const recordedFinancialResult = totalRevenue - totalExpenses;
    const recordedGrossProfit = totalRevenue - totalProviderCost;

    // A zero-sales period has no missing sale costs to reconcile.
    const providerCostsComplete = unknownCostSales === 0;

    const profitStatus = providerCostsComplete
      ? "RECORDED_COSTS_COMPLETE"
      : "PROVISIONAL";

    // Do not present incomplete calculations as confirmed profit.
    const financialResult = providerCostsComplete
      ? recordedFinancialResult
      : null;

    const grossProfit = providerCostsComplete
      ? recordedGrossProfit
      : null;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          from: from || null,
          to: to || null,
        },

        customerWalletFunds: {
          total: customerWalletFunds,
          testAccountsExcluded: true,
        },

        revenue: {
          total: totalRevenue,
          transactions: revenueEntries.length,
        },

        expenses: {
          total: totalExpenses,
          transactions: expenses.length,
        },

        financialResult,
        grossProfit,

        // Audit values based only on entries currently recorded.
        // These are not confirmed profit when provider costs are missing.
        recordedFinancialResult,
        recordedGrossProfit,

        profitStatus,
        providerCostsComplete,

        airtime: {
          revenue: sumAmounts(airtimeEntries),
          transactions: airtimeEntries.length,
        },

        data: {
          revenue: sumAmounts(dataEntries),
          transactions: dataEntries.length,
        },

        providerCosts: {
          total: totalProviderCost,
          transactions:
            knownCostSales + unlinkedProviderExpenses.length,
          unknownServiceCosts: unknownCostSales,
        },

        paystackFees: {
          total: totalPaystackFees,
          transactions: paystackFeeEntries.length,
          recoveryStatus: "NOT_RECONCILED",
        },
      },
    });
  } catch (error) {
    console.error("Get Financial Summary Error:", error);
    return next(error);
  }
};