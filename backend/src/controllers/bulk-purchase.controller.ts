
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

    const { recipients, requestId } = req.body;

    if (
      typeof requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestId
      )
    ) {
      return next(
        new AppError(
          "A valid bulk Data request ID is required.",
          400
        )
      );
    }

    const result = await purchaseBulkData({
      userId: String(userId),
      recipients,
      requestId: requestId.toLowerCase(),
    });

    const hasPending = result.pending > 0;

    return res
      .status(hasPending ? 202 : 200)
      .json(result);
  } catch (error) {
    return next(error);
  }
};
