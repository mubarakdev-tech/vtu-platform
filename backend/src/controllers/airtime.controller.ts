import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { purchaseAirtime } from "../services/airtime.service";

export const buyAirtime = catchAsync(async (req: any, res: Response) => {
  const userId = req.user;

  const { network, phone, amount } = req.body;

  if (!network || !phone || !amount) {
    return res.status(400).json({
      success: false,
      message: "Network, phone and amount are required",
    });
  }

  const result = await purchaseAirtime(
    userId,
    network,
    phone,
    Number(amount)
  );

  res.status(200).json(result);
});