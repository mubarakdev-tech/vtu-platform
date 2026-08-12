import { Response } from "express";
import catchAsync from "../utils/catchAsync";
import { purchaseAirtime } from "../services/airtime.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const buyAirtime = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const { network, phone, amount } = req.body;

  if (!network || !phone || amount === undefined) {
    return res.status(400).json({
      success: false,
      message: "Network, phone and amount are required",
    });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be greater than zero",
    });
  }

  const result = await purchaseAirtime(
    userId.toString(),
    network.toLowerCase(),
    phone.trim(),
    Number(amount)
  );

  return res.status(200).json(result);
});