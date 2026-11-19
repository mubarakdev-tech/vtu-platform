import { Request, Response, NextFunction } from "express";
import Provider from "../models/provider.model";
import AirtimePricingPolicy from "../models/airtimePricingPolicy.model";
import AppError from "../utils/AppError";

const NETWORKS = ["mtn", "airtel", "glo", "9mobile"] as const;

const emptyDiscountRates = {
  mtn: null,
  airtel: null,
  glo: null,
  "9mobile": null,
};

// =====================================================
// LIST AIRTIME PROVIDER PRICING POLICIES
// =====================================================

export const getAdminAirtimePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await Provider.find({
      supportsAirtime: true,
    })
      .sort({ sortOrder: 1, displayName: 1 })
      .select("key displayName active supportsAirtime")
      .lean();

    const policies = await AirtimePricingPolicy.find({}).lean();

    const policyMap = new Map(
      policies.map((policy) => [policy.providerKey, policy])
    );

    const data = providers.map((provider) => {
      const policy = policyMap.get(provider.key);

      return {
        ...provider,
        discountRates: policy?.discountRates || emptyDiscountRates,
        configured: Boolean(policy),
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE PROVIDER DISCOUNT RATES
// =====================================================

export const updateAdminAirtimePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providerKey = String(req.params.providerKey || "")
      .trim()
      .toLowerCase();

    if (!providerKey) {
      throw new AppError("A valid provider key is required.", 400);
    }

    const provider = await Provider.findOne({
      key: providerKey,
      supportsAirtime: true,
    }).lean();

    if (!provider) {
      throw new AppError(
        "This provider is not configured for Airtime services.",
        404
      );
    }

    const incoming = req.body?.discountRates;

    if (
      !incoming ||
      typeof incoming !== "object" ||
      Array.isArray(incoming)
    ) {
      throw new AppError(
        "Provide discountRates with at least one network rate.",
        400
      );
    }

    const suppliedNetworks = Object.keys(incoming);

    if (
      suppliedNetworks.length === 0 ||
      suppliedNetworks.some(
        (network) => !NETWORKS.includes(network as typeof NETWORKS[number])
      )
    ) {
      throw new AppError(
        "Only MTN, Airtel, Glo and 9mobile discount rates are supported.",
        400
      );
    }

    const updates: Record<string, number | null> = {};

    for (const network of suppliedNetworks) {
      const value = incoming[network];

      if (
        value !== null &&
        (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 100
        )
      ) {
        throw new AppError(
          `${network} discount must be between 0 and 100, or null to clear it.`,
          400
        );
      }

      updates[`discountRates.${network}`] = value;
    }

    const policy = await AirtimePricingPolicy.findOneAndUpdate(
      { providerKey },
      { $set: updates },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Airtime provider discount settings updated.",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};
