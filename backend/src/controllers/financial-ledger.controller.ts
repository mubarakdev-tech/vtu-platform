
import { Request, Response, NextFunction } from "express";
import FinancialLedger from "../models/financialLedger.model";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import AppError from "../utils/AppError";

const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`)
    .toISOString()
    .startsWith(value);

const escapeLedgerRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ======================================================
// FINANCIAL SUMMARY
// Existing financial reconciliation logic
// ======================================================

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
        filter.createdAt.$gte = new Date(
          `${from}T00:00:00.000Z`
        );
      }

      if (to) {
        filter.createdAt.$lte = new Date(
          `${to}T23:59:59.999Z`
        );
      }
    }

    // Entries normally use their own ledger creation date.
    const dateFilteredEntries: any[] =
      await FinancialLedger.find(filter).lean();

    // Identify production customer accounts.
    const productionUsers = await User.find({
      role: "user",
      isTest: { $ne: true },
    })
      .select("_id")
      .lean();

    const productionUserIds = productionUsers.map(
      (user) => user._id
    );

    // Reconcile all successful production Airtime/Data transactions.
    const allSuccessfulServiceTransactions: any[] =
      await Transaction.find({
        user: { $in: productionUserIds },
        type: "DEBIT",
        status: "SUCCESS",
        category: { $in: ["AIRTIME", "DATA"] },
        "metadata.isTest": { $ne: true },
      })
        .select("_id")
        .lean();

    const allSuccessfulServiceIds = new Set(
      allSuccessfulServiceTransactions.map(
        (item) => String(item._id)
      )
    );

    // Apply the selected reporting period to the original transaction date.
    const transactionDateFilter: Record<string, any> = {};

    if (from) {
      transactionDateFilter.$gte = new Date(
        `${from}T00:00:00.000Z`
      );
    }

    if (to) {
      transactionDateFilter.$lte = new Date(
        `${to}T23:59:59.999Z`
      );
    }

    const successfulServiceTransactions: any[] =
      await Transaction.find({
        user: { $in: productionUserIds },
        type: "DEBIT",
        status: "SUCCESS",
        category: { $in: ["AIRTIME", "DATA"] },
        "metadata.isTest": { $ne: true },
        ...(Object.keys(transactionDateFilter).length
          ? { createdAt: transactionDateFilter }
          : {}),
      })
        .select("_id category")
        .lean();

    const serviceTransactionIds =
      successfulServiceTransactions.map(
        (item) => item._id
      );

    // Find matching sales ledger entries regardless of ledger date.
    const matchingSalesLedgerEntries: any[] =
      serviceTransactionIds.length
        ? await FinancialLedger.find({
            type: "REVENUE",
            category: {
              $in: ["AIRTIME_SALE", "DATA_SALE"],
            },
            transaction: { $in: serviceTransactionIds },
            "metadata.isTest": { $ne: true },
          })
            .select("transaction category")
            .lean()
        : [];

    const expectedSaleCategory = (transaction: any) =>
      transaction.category === "AIRTIME"
        ? "AIRTIME_SALE"
        : "DATA_SALE";

    const matchedSaleKeys = new Set(
      matchingSalesLedgerEntries
        .filter((entry) => entry.transaction)
        .map(
          (entry) =>
            `${String(entry.transaction)}:${entry.category}`
        )
    );

    const missingSalesTransactions =
      successfulServiceTransactions.filter(
        (item) =>
          !matchedSaleKeys.has(
            `${String(item._id)}:${expectedSaleCategory(item)}`
          )
      );

    const missingAirtimeSalesTransactions =
      successfulServiceTransactions.filter(
        (item) =>
          item.category === "AIRTIME" &&
          !matchedSaleKeys.has(
            `${String(item._id)}:AIRTIME_SALE`
          )
      );

    const missingDataSalesTransactions =
      successfulServiceTransactions.filter(
        (item) =>
          item.category === "DATA" &&
          !matchedSaleKeys.has(
            `${String(item._id)}:DATA_SALE`
          )
      );

    const salesComplete =
      missingSalesTransactions.length === 0;

    // Load linked sales and provider costs for transactions in the
    // selected period, regardless of when the ledger entries were created.
    const periodLinkedFinancialEntries: any[] =
      serviceTransactionIds.length
        ? await FinancialLedger.find({
            $or: [
              {
                type: "REVENUE",
                category: {
                  $in: ["AIRTIME_SALE", "DATA_SALE"],
                },
              },
              {
                type: "EXPENSE",
                category: "PROVIDER_COST",
              },
            ],
            transaction: { $in: serviceTransactionIds },
            "metadata.isTest": { $ne: true },
          }).lean()
        : [];

    // Keep unrelated entries on their own ledger dates.
    // Remove linked entries for successful service transactions from
    // the date-filtered list to avoid duplication or incorrect attribution.
    const entries: any[] = [
      ...dateFilteredEntries.filter((entry) => {
        if (!entry.transaction) return true;

        const isLinkedServiceEntry =
          (
            entry.type === "REVENUE" &&
            ["AIRTIME_SALE", "DATA_SALE"].includes(
              entry.category
            )
          ) ||
          (
            entry.type === "EXPENSE" &&
            entry.category === "PROVIDER_COST"
          );

        if (!isLinkedServiceEntry) return true;

        return !allSuccessfulServiceIds.has(
          String(entry.transaction)
        );
      }),
      ...periodLinkedFinancialEntries,
    ];

    // Current production customer wallet funds.
    // Test accounts are excluded from this financial control figure.
    const productionWallets = await Wallet.find({
      user: { $in: productionUserIds },
    })
      .select("balance")
      .lean();

    const customerWalletFunds = productionWallets.reduce(
      (total, wallet) =>
        total + Number(wallet.balance || 0),
      0
    );

    // Successful service sales recorded as revenue.
    const sales = entries.filter(
      (entry) =>
        entry.type === "REVENUE" &&
        ["AIRTIME_SALE", "DATA_SALE"].includes(
          entry.category
        )
    );

    const revenueEntries = entries.filter(
      (entry) =>
        entry.type === "REVENUE" &&
        [
          "AIRTIME_SALE",
          "DATA_SALE",
          "OTHER_REVENUE",
        ].includes(entry.category)
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
        ![
          "PROVIDER_COST",
          "PAYSTACK_FEE",
        ].includes(entry.category)
    );

    const sumAmounts = (items: any[]) =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const airtimeEntries = sales.filter(
      (entry) => entry.category === "AIRTIME_SALE"
    );

    const dataEntries = sales.filter(
      (entry) => entry.category === "DATA_SALE"
    );

    // Index provider-cost expense entries by linked sale transaction.
    const expensesByTransaction = new Map<
      string,
      any[]
    >();

    for (const expense of providerExpenseEntries) {
      if (!expense.transaction) continue;

      const key = String(expense.transaction);
      const linked =
        expensesByTransaction.get(key) || [];

      linked.push(expense);
      expensesByTransaction.set(key, linked);
    }

    let totalProviderCost = 0;
    let knownCostSales = 0;
    let unknownCostSales = 0;

    const airtimeCostStats = {
      providerCost: 0,
      knownCostSales: 0,
      unknownCostSales: 0,
    };

    const dataCostStats = {
      providerCost: 0,
      knownCostSales: 0,
      unknownCostSales: 0,
    };

    const consumedProviderExpenseIds =
      new Set<string>();

    for (const sale of sales) {
      const saleTransactionId = sale.transaction
        ? String(sale.transaction)
        : "";

      const linkedExpenses = saleTransactionId
        ? expensesByTransaction.get(
            saleTransactionId
          ) || []
        : [];

      const metadata = sale.metadata || {};

      const serviceCostStats =
        sale.category === "AIRTIME_SALE"
          ? airtimeCostStats
          : dataCostStats;

      const directCostIsKnown =
        typeof sale.providerCost === "number" &&
        Number.isFinite(sale.providerCost) &&
        sale.providerCost >= 0;

      const metadataCost = Number(
        metadata.providerCost
      );

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

        serviceCostStats.providerCost += cost;
        serviceCostStats.knownCostSales += 1;

        // Avoid counting the same sale cost twice.
        for (const expense of linkedExpenses) {
          consumedProviderExpenseIds.add(
            String(expense._id)
          );
        }
      } else if (linkedExpenses.length > 0) {
        totalProviderCost += sumAmounts(
          linkedExpenses
        );

        knownCostSales += 1;

        serviceCostStats.providerCost += sumAmounts(
          linkedExpenses
        );
        serviceCostStats.knownCostSales += 1;

        for (const expense of linkedExpenses) {
          consumedProviderExpenseIds.add(
            String(expense._id)
          );
        }
      } else {
        // Never assume an unrecorded provider cost is zero.
        unknownCostSales += 1;
        serviceCostStats.unknownCostSales += 1;
      }
    }

    // Include provider-cost entries not already attributed to a sale.
    const unlinkedProviderExpenses =
      providerExpenseEntries.filter(
        (expense) =>
          !consumedProviderExpenseIds.has(
            String(expense._id)
          )
      );

    totalProviderCost += sumAmounts(
      unlinkedProviderExpenses
    );

    const totalRevenue = sumAmounts(
      revenueEntries
    );

    const otherExpenses = sumAmounts(
      otherExpenseEntries
    );

    const totalPaystackFees = sumAmounts(
      paystackFeeEntries
    );

    // Includes recorded provider costs, Paystack fees and other expenses.
    const totalExpenses =
      totalProviderCost +
      otherExpenses +
      totalPaystackFees;

    // Arithmetic based only on currently recorded amounts.
    const recordedFinancialResult =
      totalRevenue - totalExpenses;

    const recordedGrossProfit =
      totalRevenue - totalProviderCost;

    // A zero-sales period has no missing sale costs to reconcile.
    const providerCostsComplete =
      unknownCostSales === 0;

    const reconciliationComplete =
      salesComplete && providerCostsComplete;

    const profitStatus = reconciliationComplete
      ? "RECORDED_COSTS_COMPLETE"
      : "PROVISIONAL";

    // Do not present incomplete calculations as confirmed profit.
    const financialResult = reconciliationComplete
      ? recordedFinancialResult
      : null;

    const grossProfit = reconciliationComplete
      ? recordedGrossProfit
      : null;

    const airtimeRevenue = sumAmounts(airtimeEntries);
    const dataRevenue = sumAmounts(dataEntries);

    const airtimeRecordedGrossProfit =
      airtimeRevenue - airtimeCostStats.providerCost;

    const dataRecordedGrossProfit =
      dataRevenue - dataCostStats.providerCost;

    const airtimeProviderCostsComplete =
      airtimeCostStats.unknownCostSales === 0;

    const dataProviderCostsComplete =
      dataCostStats.unknownCostSales === 0;

    const airtimeReconciliationComplete =
      missingAirtimeSalesTransactions.length === 0 &&
      airtimeProviderCostsComplete;

    const dataReconciliationComplete =
      missingDataSalesTransactions.length === 0 &&
      dataProviderCostsComplete;

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
        recordedFinancialResult,
        recordedGrossProfit,

        profitStatus,
        providerCostsComplete,
        salesComplete,
        reconciliationComplete,

        salesReconciliation: {
          successfulServiceTransactions:
            successfulServiceTransactions.length,

          matchedSalesTransactions:
            successfulServiceTransactions.length -
            missingSalesTransactions.length,

          missingSalesTransactions:
            missingSalesTransactions.length,
        },

        airtime: {
          revenue: airtimeRevenue,
          transactions: airtimeEntries.length,
          missingSalesTransactions: missingAirtimeSalesTransactions.length,
          providerCost: airtimeCostStats.providerCost,
          knownCostTransactions: airtimeCostStats.knownCostSales,
          unknownCostTransactions: airtimeCostStats.unknownCostSales,
          recordedGrossProfit: airtimeRecordedGrossProfit,
          grossProfit: airtimeReconciliationComplete
            ? airtimeRecordedGrossProfit
            : null,
          providerCostsComplete: airtimeProviderCostsComplete,
          reconciliationComplete: airtimeReconciliationComplete,
        },

        data: {
          revenue: dataRevenue,
          transactions: dataEntries.length,
          providerCost: dataCostStats.providerCost,
          knownCostTransactions: dataCostStats.knownCostSales,
          unknownCostTransactions: dataCostStats.unknownCostSales,
          recordedGrossProfit: dataRecordedGrossProfit,
          grossProfit: dataReconciliationComplete
            ? dataRecordedGrossProfit
            : null,
          providerCostsComplete: dataProviderCostsComplete,
          reconciliationComplete: dataReconciliationComplete,
        },

        providerCosts: {
          total: totalProviderCost,

          transactions:
            knownCostSales +
            unlinkedProviderExpenses.length,

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
    console.error(
      "Get Financial Summary Error:",
      error
    );

    return next(error);
  }
};

// ======================================================
// FINANCIAL LEDGER ENTRIES
// Read-only, paginated admin ledger listing
// ======================================================

export const getFinancialEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
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

    const filter: Record<string, any> = {
      "metadata.isTest": { $ne: true },
    };

    const type = String(req.query.type || "").toUpperCase();
    const category = String(req.query.category || "").toUpperCase();
    const search = String(req.query.search || "").trim();

    const from = String(req.query.from || "");
    const to = String(req.query.to || "");

    if (["REVENUE", "EXPENSE"].includes(type)) {
      filter.type = type;
    }

    const allowedCategories = [
      "AIRTIME_SALE",
      "DATA_SALE",
      "WALLET_FUNDING",
      "PAYSTACK_FEE",
      "PROVIDER_COST",
      "REFUND",
      "OTHER_REVENUE",
      "OTHER_EXPENSE",
    ];

    if (allowedCategories.includes(category)) {
      filter.category = category;
    }

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

    // These dates filter the ledger entry creation date,
    // not the linked service transaction date.
    if (from || to) {
      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte = new Date(
          `${from}T00:00:00.000Z`
        );
      }

      if (to) {
        filter.createdAt.$lte = new Date(
          `${to}T23:59:59.999Z`
        );
      }
    }

    if (search) {
      const pattern = new RegExp(
        escapeLedgerRegex(search),
        "i"
      );

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
        { description: pattern },
        { provider: pattern },
        { service: pattern },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const [entries, total] = await Promise.all([
      FinancialLedger.find(filter)
        .populate("user", "name email phone")
        .populate(
          "transaction",
          "category status createdAt reference"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      FinancialLedger.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: entries.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      entries,
    });
  } catch (error) {
    console.error(
      "Financial Ledger Entries Error:",
      error
    );

    return next(error);
  }
};
