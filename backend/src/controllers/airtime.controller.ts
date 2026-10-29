
import { Response, NextFunction } from "express";
import { purchaseAirtime } from "../services/airtime.service";
import AppError from "../utils/AppError";
import { AuthRequest } from "../middleware/auth.middleware";

export const buyAirtime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { network, phone, amount } = req.body;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (
      !network ||
      !phone ||
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return next(
        new AppError(
          "Network, phone and amount are required",
          400
        )
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return next(new AppError("Invalid airtime amount", 400));
    }

    const result = await purchaseAirtime({
      userId,
      network,
      phone,
      amount: numericAmount,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
