import { Response } from "express";
import catchAsync from "../utils/catchAsync";
import { purchaseData } from "../services/data.service";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { AuthRequest } from "../middleware/auth.middleware";

export const buyData = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const { network, phone, plan, amount } = req.body;

  if (!network || !phone || !plan || !amount) {
    return res.status(400).json({
      success: false,
      message: "Network, phone, plan and amount are required",
    });
  }

  const result = await purchaseData({
    userId: userId.toString(),
    network: network.toLowerCase(),
    phone: phone.trim(),
    plan,
    amount: Number(amount),
  });

  return res.status(200).json(result);
});

export const getDataPlans = catchAsync(async (req: AuthRequest, res: Response) => {
  const { network } = req.params;

  if (!network) {
    return res.status(400).json({
      success: false,
      message: "Network is required",
    });
  }

  const result = await vtpassProvider.getDataPlans(network.toLowerCase());

  return res.status(200).json(result);
});