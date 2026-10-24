
import { Request, Response, NextFunction } from "express";
import DataPlan from "../models/dataPlan.model";
import ProviderPlan from "../models/providerPlan.model";
import Provider from "../models/provider.model";
import AppError from "../utils/AppError";
import { registeredProviders } from "../providers/provider.registry";

export const listDataPricingPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await DataPlan.find()
      .sort({ network: 1, sortOrder: 1, name: 1 })
      .populate("provider", "key displayName")
      .populate(
        "providerPlan",
        "name providerCost providerPlanCode validity active"
      )
      .lean();

    const data = plans.map((plan: any) => {
      const providerPlan = plan.providerPlan;

      const rawCost =
        providerPlan?.providerCost;

      const providerCost =
        rawCost !== null &&
        rawCost !== undefined &&
        rawCost !== "" &&
        Number.isFinite(Number(rawCost))
          ? Number(rawCost)
          : null;

      return {
        id: String(plan._id),
        network: plan.network,
        dataType: plan.dataType,
        name: plan.name,
        validity: plan.validity || providerPlan?.validity || "",
        provider: plan.provider
          ? {
              key: plan.provider.key,
              displayName: plan.provider.displayName,
            }
          : null,
        providerPlan: providerPlan
          ? {
              id: String(providerPlan._id),
              name: providerPlan.name,
              code: providerPlan.providerPlanCode,
              active: Boolean(providerPlan.active),
            }
          : null,
        providerCost,
        sellingPrice: Number(plan.amount),
        expectedProfit:
          providerCost === null
            ? null
            : Number(
                (Number(plan.amount) - providerCost).toFixed(2)
              ),
        active: Boolean(plan.active),
        costStatus:
          providerCost === null ? "UNKNOWN" : "RECORDED",
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateDataPricingPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { sellingPrice, providerCost, active } = req.body || {};

    if (
      sellingPrice === undefined &&
      providerCost === undefined &&
      active === undefined
    ) {
      return next(
        new AppError("No pricing changes supplied", 400)
      );
    }

    if (
      sellingPrice !== undefined &&
      (
        sellingPrice === null ||
        String(sellingPrice).trim() === "" ||
        !Number.isFinite(Number(sellingPrice)) ||
        Number(sellingPrice) <= 0
      )
    ) {
      return next(
        new AppError(
          "Selling price must be greater than zero",
          400
        )
      );
    }

    if (
      providerCost !== undefined &&
      (
        providerCost === null ||
        String(providerCost).trim() === "" ||
        !Number.isFinite(Number(providerCost)) ||
        Number(providerCost) < 0
      )
    ) {
      return next(
        new AppError(
          "Provider cost must be a valid non-negative amount",
          400
        )
      );
    }

    if (
      active !== undefined &&
      typeof active !== "boolean"
    ) {
      return next(
        new AppError("Active must be true or false", 400)
      );
    }

    const plan = await DataPlan.findById(id);

    if (!plan) {
      return next(new AppError("Data plan not found", 404));
    }

    let linkedProviderPlan: any = null;

    if (providerCost !== undefined) {
      if (!plan.providerPlan) {
        return next(
          new AppError(
            "Map this AbuPay plan to a provider plan before updating its provider cost",
            409
          )
        );
      }

      linkedProviderPlan = await ProviderPlan.findById(
        plan.providerPlan
      );

      if (!linkedProviderPlan) {
        return next(
          new AppError(
            "Linked provider plan was not found",
            409
          )
        );
      }

      linkedProviderPlan.providerCost = Number(providerCost);
      await linkedProviderPlan.save();
    }

    if (sellingPrice !== undefined) {
      plan.amount = Number(sellingPrice);
    }

    if (active !== undefined) {
      plan.active = active;
    }

    await plan.save();

    if (!linkedProviderPlan && plan.providerPlan) {
      linkedProviderPlan = await ProviderPlan.findById(
        plan.providerPlan
      );
    }

    const rawCost = linkedProviderPlan?.providerCost;

    const cost =
      rawCost !== null &&
      rawCost !== undefined &&
      rawCost !== "" &&
      Number.isFinite(Number(rawCost))
        ? Number(rawCost)
        : null;

    return res.status(200).json({
      success: true,
      message: "Data pricing updated",
      data: {
        id: String(plan._id),
        network: plan.network,
        name: plan.name,
        sellingPrice: Number(plan.amount),
        providerCost: cost,
        expectedProfit:
          cost === null
            ? null
            : Number(
                (Number(plan.amount) - cost).toFixed(2)
              ),
        active: Boolean(plan.active),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listDataPricingProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await Provider.find({
      active: true,
      supportsData: true,
    })
      .sort({ sortOrder: 1, displayName: 1 })
      .select("key displayName")
      .lean();

    const data = providers
      .filter((provider: any) => {
        const adapter = registeredProviders[provider.key];

        return Boolean(
          adapter &&
          typeof adapter.getDataPlans === "function"
        );
      })
      .map((provider: any) => ({
        key: provider.key,
        displayName: provider.displayName,
      }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getDataProviderCatalogue = async (
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

    const network = String(req.query.network || "")
      .trim()
      .toLowerCase();

    if (!network) {
      return next(
        new AppError("Network is required", 400)
      );
    }

    const provider = await Provider.findOne({
      key: providerKey,
      active: true,
      supportsData: true,
    }).lean();

    if (!provider) {
      return next(
        new AppError(
          "Provider is not active or does not support data",
          404
        )
      );
    }

    const adapter = registeredProviders[providerKey];

    if (
      !adapter ||
      typeof adapter.getDataPlans !== "function"
    ) {
      return next(
        new AppError(
          "No data integration is registered for this provider",
          409
        )
      );
    }

    // Read only the selected provider's catalogue.
    // No purchase or provider fallback is performed.
    const catalogue = await adapter.getDataPlans(network);

    const data = (catalogue || [])
      .map((item: any) => {
        const raw = item.raw || {};
        const amount = Number(item.amount);

        return {
          name: String(
            item.name || item.variation_code || ""
          ),
          code: String(item.variation_code || ""),
          catalogueAmount:
            item.amount !== undefined &&
            item.amount !== null &&
            Number.isFinite(amount)
              ? amount
              : null,
          validity: String(
            item.validity ||
            raw.validity ||
            raw.duration ||
            ""
          ),
        };
      })
      .filter((item: any) => item.code !== "");

    return res.status(200).json({
      success: true,
      data: {
        provider: {
          key: provider.key,
          displayName: provider.displayName,
        },
        network,
        plans: data,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const mapDataPricingPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const providerKey = String(
      req.body?.providerKey || ""
    )
      .trim()
      .toLowerCase();

    const providerPlanCode = String(
      req.body?.providerPlanCode || ""
    ).trim();

    const rawCost = req.body?.providerCost;
    const providerCost = Number(rawCost);
    const costConfirmed = req.body?.costConfirmed;

    if (!providerKey || !providerPlanCode) {
      return next(
        new AppError(
          "Provider and provider plan code are required",
          400
        )
      );
    }

    if (
      rawCost === undefined ||
      rawCost === null ||
      String(rawCost).trim() === "" ||
      !Number.isFinite(providerCost) ||
      providerCost < 0
    ) {
      return next(
        new AppError(
          "Enter a valid provider buying cost",
          400
        )
      );
    }

    if (costConfirmed !== true) {
      return next(
        new AppError(
          "Confirm that the buying cost has been verified against the provider account",
          400
        )
      );
    }

    const plan = await DataPlan.findById(id);

    if (!plan) {
      return next(
        new AppError("Data plan not found", 404)
      );
    }

    const provider = await Provider.findOne({
      key: providerKey,
      active: true,
      supportsData: true,
    });

    if (!provider) {
      return next(
        new AppError(
          "Provider is not active or does not support data",
          404
        )
      );
    }

    const adapter = registeredProviders[providerKey];

    if (
      !adapter ||
      typeof adapter.getDataPlans !== "function"
    ) {
      return next(
        new AppError(
          "No data integration is registered for this provider",
          409
        )
      );
    }

    // Verify the exact plan code against the selected provider.
    const catalogue = await adapter.getDataPlans(
      plan.network
    );

    const selectedPlan = (catalogue || []).find(
      (item: any) =>
        String(item.variation_code || "") ===
        providerPlanCode
    ) as any;

    if (!selectedPlan) {
      return next(
        new AppError(
          "The selected plan code was not found in the provider's current catalogue for this network",
          409
        )
      );
    }

    const raw = selectedPlan.raw || {};
    const catalogueAmount = Number(selectedPlan.amount);

    const linkedProviderPlan =
      await ProviderPlan.findOneAndUpdate(
        {
          provider: provider._id,
          network: plan.network,
          dataType: plan.dataType,
          providerPlanCode,
        },
        {
          $set: {
            name: String(
              selectedPlan.name ||
              selectedPlan.variation_code
            ),
            validity: String(
              selectedPlan.validity ||
              raw.validity ||
              raw.duration ||
              ""
            ),
            providerCost,
            active: true,
            "metadata.catalogueSource": providerKey,
            "metadata.catalogueAmount":
              Number.isFinite(catalogueAmount)
                ? catalogueAmount
                : null,
            "metadata.catalogueCheckedAt": new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    // Change only the mapping references. Do not change the
    // customer selling price or transaction history.
    plan.provider = provider._id;
    plan.providerPlan = linkedProviderPlan._id;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Provider mapping saved",
      data: {
        id: String(plan._id),
        provider: {
          key: provider.key,
          displayName: provider.displayName,
        },
        providerPlan: {
          id: String(linkedProviderPlan._id),
          name: linkedProviderPlan.name,
          code: linkedProviderPlan.providerPlanCode,
          providerCost: linkedProviderPlan.providerCost,
        },
        sellingPrice: Number(plan.amount),
        expectedProfit: Number(
          (Number(plan.amount) - providerCost).toFixed(2)
        ),
      },
    });
  } catch (error) {
    return next(error);
  }
};
