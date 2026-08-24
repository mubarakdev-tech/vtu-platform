import { Request, Response, NextFunction } from "express";
import { purchaseAirtime } from "../services/airtime.service";
import AppError from "../utils/apperror";

export const buyAirtime = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { network, phone, amount, provider } = req.body;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!network || !phone || !amount) {
      return next(new AppError("Network, phone and amount are required", 400));
    }

    const result = await purchaseAirtime({
      userId,
      network,
      phone,
      amount: Number(amount),
      provider: provider || "vtpass",
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};