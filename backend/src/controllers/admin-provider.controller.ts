import { Request, Response, NextFunction } from "express";
import Provider from "../models/provider.model";
import AppError from "../utils/AppError";
import { registeredProviders } from "../providers/provider.manager";

// =====================================================
// GET PROVIDER WALLET BALANCES
// =====================================================

export const getProviderBalances = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await Provider.find({})
      .sort({ sortOrder: 1 })
      .select("key displayName active")
      .lean();

    const balances = await Promise.all(
      providers.map(async (provider) => {
        const implementation =
          registeredProviders[provider.key];

        if (!implementation?.getBalance) {
          return {
            key: provider.key,
            displayName: provider.displayName,
            active: provider.active,
            available: false,
            balance: null,
            isTest: false,
            message: "Balance lookup is not available for this provider.",
          };
        }

        const result =
          await implementation.getBalance();

        const isTest =
          provider.key === "vtpass" &&
          String(process.env.VTPASS_BASE_URL || "")
            .toLowerCase()
            .includes("sandbox");

        return {
          key: provider.key,
          displayName: provider.displayName,
          active: provider.active,
          available: result.success === true,
          balance:
            result.success === true &&
            Number.isFinite(result.balance)
              ? Number(result.balance)
              : null,
          isTest,
          message: result.message,
        };
      })
    );

    const productionTotal = balances.reduce(
      (total, item) =>
        item.available &&
        !item.isTest &&
        typeof item.balance === "number"
          ? total + item.balance
          : total,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        providers: balances,
        productionTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================
// LIST PROVIDERS & ROUTING STATUS
// =====================================================

export const getAdminProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await Provider.find({})
      .sort({
        sortOrder: 1,
        displayName: 1,
      })
      .select(
        "key displayName active sortOrder supportsAirtime supportsData activeForAirtime activeForData"
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SELECT ACTIVE AIRTIME PROVIDER
// =====================================================

export const setActiveAirtimeProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providerKey = String(
      req.params.providerKey || ""
    )
      .trim()
      .toLowerCase();

    const provider = await Provider.findOne({
      key: providerKey,
      active: true,
      supportsAirtime: true,
    });

    if (!provider) {
      return next(
        new AppError(
          "Provider is unavailable for airtime services.",
          404
        )
      );
    }

    await Provider.updateMany(
      {},
      {
        $set: {
          activeForAirtime: false,
        },
      }
    );

    provider.activeForAirtime = true;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: `${provider.displayName} is now the active Airtime provider.`,
      data: {
        key: provider.key,
        displayName: provider.displayName,
        activeForAirtime: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SELECT ACTIVE DATA PROVIDER
// =====================================================

export const setActiveDataProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providerKey = String(
      req.params.providerKey || ""
    )
      .trim()
      .toLowerCase();

    const provider = await Provider.findOne({
      key: providerKey,
      active: true,
      supportsData: true,
    });

    if (!provider) {
      return next(
        new AppError(
          "Provider is unavailable for data services.",
          404
        )
      );
    }

    await Provider.updateMany(
      {},
      {
        $set: {
          activeForData: false,
        },
      }
    );

    provider.activeForData = true;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: `${provider.displayName} is now the active Data provider.`,
      data: {
        key: provider.key,
        displayName: provider.displayName,
        activeForData: true,
      },
    });
  } catch (error) {
    next(error);
  }
};
