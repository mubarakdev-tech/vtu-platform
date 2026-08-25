import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import * as dataService from "../services/data.service";
import { getProvider } from "../providers";

export const getDataPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const network = String(req.params.network || "")
      .toLowerCase()
      .trim();

    const providerName = String(
      req.query.provider || req.body?.provider || "vtpass"
    )
      .toLowerCase()
      .trim();

    if (!network) {
      return next(new AppError("Network is required", 400));
    }

    const provider = getProvider(providerName);

    if (!provider || typeof provider.getDataPlans !== "function") {
      return next(
        new AppError("Provider does not support data plans", 400)
      );
    }

    console.log("GET DATA PLANS:", {
      network,
      provider: providerName,
    });

    const plans = await provider.getDataPlans(network);

    return res.status(200).json({
      success: true,
      data: Array.isArray(plans) ? plans : [],
      provider: providerName,
    });
  } catch (error: any) {
    console.error(
      "GET DATA PLANS ERROR:",
      error?.response?.data || error?.message || error
    );

    return next(
      new AppError(
        error?.message || "Failed to fetch data plans",
        500
      )
    );
  }
};

export const buyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      (req as any).user?.id ||
      (req as any).user?._id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const {
      network,
      phone,
      plan,
      amount,
      provider,
    } = req.body;

    console.log("BUY DATA BODY:", {
      userId,
      network,
      phone,
      plan,
      amount,
      provider,
    });

    if (
      !network ||
      !phone ||
      !plan ||
      amount === undefined ||
      amount === null
    ) {
      return next(
        new AppError(
          "network, phone, plan and amount are required",
          400
        )
      );
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return next(
        new AppError("Invalid amount", 400)
      );
    }

    const selectedProvider = String(
      provider || "vtpass"
    )
      .toLowerCase()
      .trim();

    const result = await dataService.buyData({
      userId: String(userId),
      network: String(network)
        .toLowerCase()
        .trim(),
      phone: String(phone).trim(),
      plan: String(plan),
      amount: value,
      provider: selectedProvider,
    });

    return res
      .status(result.success ? 200 : 400)
      .json(result);
  } catch (error: any) {
    console.error(
      "BUY DATA CONTROLLER ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError(
        error?.message || "Data purchase failed",
        500
      )
    );
  }
};
