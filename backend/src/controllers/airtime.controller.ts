import { Response } from "express";
import catchAsync from "../utils/catchAsync";
import { purchaseAirtime } from "../services/airtime.service";

export const buyAirtime = catchAsync(async (req: any, res: Response) => {

  const userId = req.user;

  const {
    network,
    phone,
    amount,
  } = req.body;

  // Validate request
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

  console.log("======================================");
  console.log("BUY AIRTIME CONTROLLER");
  console.log("User ID :", userId);
  console.log("Network :", network);
  console.log("Phone   :", phone);
  console.log("Amount  :", amount);
  console.log("======================================");

  const result = await purchaseAirtime(
    userId,
    network.toLowerCase(),
    phone.trim(),
    Number(amount)
  );

  console.log("AIRTIME RESULT:");
  console.log(result);

  return res.status(200).json(result);

});