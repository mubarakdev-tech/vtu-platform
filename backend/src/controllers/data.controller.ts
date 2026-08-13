import { Request, Response, NextFunction } from "express";
import { purchaseData } from "../services/data.service";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import AppError from "../utils/apperror";

/**
 * Get data plans for a network
 */
export const getDataPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { network } = req.params;

    if (!network) {
      return next(new AppError("Network is required", 400));
    }

    console.log("Fetching data plans for network:", network);

    const plans = await vtpassProvider.getDataPlans(network.toLowerCase());

    console.log("Plans received from provider:", plans);

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buy data
 */
export const buyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { network, phone, plan, amount } = req.body;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!network || !phone || !plan || !amount) {
      return next(new AppError("All fields are required", 400));
    }

    const result = await purchaseData({
      userId,
      network,
      phone,
      plan,
      amount: Number(amount),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};