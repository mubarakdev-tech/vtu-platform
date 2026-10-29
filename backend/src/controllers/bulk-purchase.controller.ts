import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import AppError from "../utils/AppError";
import {
  purchaseBulkAirtime,
  purchaseBulkData,
} from "../services/bulk-purchase.service";

export const buyBulkAirtime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const { recipients } = req.body;

    const result = await purchaseBulkAirtime({
      userId: String(userId),
      recipients,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const buyBulkData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const { recipients } = req.body;

    const result = await purchaseBulkData({
      userId: String(userId),
      recipients,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};