import { Request, Response, NextFunction } from "express";
import FinancialLedger from "../models/financialLedger.model";
import AppError from "../utils/AppError";

/**
 * ==========================================
 * GET FINANCIAL SUMMARY
 * ==========================================
 *
 * Returns AbuPay's financial overview.
 *
 * IMPORTANT:
 *
 * This endpoint is intended for the
 * administrative side of AbuPay.
 *
 * It should NOT be exposed to normal
 * customers.
 */
export const getFinancialSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    /**
     * ========================================
     * DATE FILTER
     * ========================================
     *
     * Optional:
     *
     * ?from=2026-08-01
     * ?to=2026-08-19
     *
     * If no dates are supplied,
     * all financial records are included.
     */

    const from =
      req.query.from as string | undefined;

    const to =
      req.query.to as string | undefined;

    const filter: any = {};

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const fromDate =
          new Date(`${from}T00:00:00.000Z`);

        if (
          Number.isNaN(
            fromDate.getTime()
          )
        ) {
          return next(
            new AppError(
              "Invalid from date",
              400
            )
          );
        }

        filter.createdAt.$gte =
          fromDate;
      }

      if (to) {
        const toDate =
          new Date(`${to}T23:59:59.999Z`);

        if (
          Number.isNaN(
            toDate.getTime()
          )
        ) {
          return next(
            new AppError(
              "Invalid to date",
              400
            )
          );
        }

        filter.createdAt.$lte =
          toDate;
      }
    }

    console.log(
      "======================================"
    );

    console.log(
      "FINANCIAL SUMMARY REQUEST"
    );

    console.log(
      "From:",
      from || "ALL"
    );

    console.log(
      "To:",
      to || "ALL"
    );

    console.log(
      "======================================"
    );

    /**
     * ========================================
     * REVENUE
     * ========================================
     */

    const revenueResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            type: "REVENUE",
          },
        },
        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$amount",
            },

            revenueCount: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * EXPENSE
     * ========================================
     */

    const expenseResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            type: "EXPENSE",
          },
        },
        {
          $group: {
            _id: null,

            totalExpenses: {
              $sum: "$amount",
            },

            expenseCount: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * AIRTIME REVENUE
     * ========================================
     */

    const airtimeResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            type: "REVENUE",
            category: "AIRTIME_SALE",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * DATA REVENUE
     * ========================================
     */

    const dataResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            type: "REVENUE",
            category: "DATA_SALE",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * PROVIDER COST
     * ========================================
     *
     * This will remain zero until we start
     * recording actual provider costs.
     */

    const providerCostResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            category: "PROVIDER_COST",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * PAYSTACK FEES
     * ========================================
     */

    const paystackFeeResult =
      await FinancialLedger.aggregate([
        {
          $match: {
            ...filter,
            category: "PAYSTACK_FEE",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    /**
     * ========================================
     * EXTRACT VALUES
     * ========================================
     */

    const totalRevenue =
      revenueResult[0]?.totalRevenue ||
      0;

    const totalExpenses =
      expenseResult[0]?.totalExpenses ||
      0;

    const totalProviderCost =
      providerCostResult[0]?.total ||
      0;

    const totalPaystackFees =
      paystackFeeResult[0]?.total ||
      0;

    /**
     * ========================================
     * CURRENT GROSS PROFIT
     * ========================================
     *
     * This is a preliminary calculation.
     *
     * Once actual provider costs are
     * recorded, this becomes meaningful.
     */

    const grossProfit =
      totalRevenue -
      totalExpenses;

    /**
     * ========================================
     * RESPONSE
     * ========================================
     */

    return res.status(200).json({
      success: true,

      data: {
        period: {
          from:
            from || null,

          to:
            to || null,
        },

        revenue: {
          total:
            totalRevenue,

          transactions:
            revenueResult[0]
              ?.revenueCount || 0,
        },

        expenses: {
          total:
            totalExpenses,

          transactions:
            expenseResult[0]
              ?.expenseCount || 0,
        },

        grossProfit,

        airtime: {
          revenue:
            airtimeResult[0]?.total ||
            0,

          transactions:
            airtimeResult[0]?.count ||
            0,
        },

        data: {
          revenue:
            dataResult[0]?.total ||
            0,

          transactions:
            dataResult[0]?.count ||
            0,
        },

        providerCosts: {
          total:
            totalProviderCost,

          transactions:
            providerCostResult[0]
              ?.count || 0,
        },

        paystackFees: {
          total:
            totalPaystackFees,

          transactions:
            paystackFeeResult[0]
              ?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get Financial Summary Error:",
      error
    );

    next(error);
  }
};
