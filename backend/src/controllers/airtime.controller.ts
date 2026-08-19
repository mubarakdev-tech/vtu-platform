import { Response } from "express";
import catchAsync from "../utils/catchAsync";
import { purchaseAirtime } from "../services/airtime.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const buyAirtime = catchAsync(
  async (
    req: AuthRequest,
    res: Response
  ) => {

    // ==========================================
    // GET AUTHENTICATED USER ID
    // ==========================================

    const userId =
      req.user?._id?.toString() ||
      req.user?.id?.toString();

    console.log(
      "\n======================================"
    );

    console.log(
      "AIRTIME CONTROLLER"
    );

    console.log(
      "User ID:",
      userId
    );

    console.log(
      "User email:",
      req.user?.email
    );

    console.log(
      "======================================"
    );

    // ==========================================
    // CHECK AUTHENTICATION
    // ==========================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user ID is missing",
      });
    }

    // ==========================================
    // GET REQUEST DATA
    // ==========================================

    const {
      network,
      phone,
      amount,
    } = req.body;

    // ==========================================
    // VALIDATE REQUEST
    // ==========================================

    if (
      !network ||
      !phone ||
      amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Network, phone and amount are required",
      });
    }

    const airtimeAmount =
      Number(amount);

    if (
      !Number.isFinite(
        airtimeAmount
      ) ||
      airtimeAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be greater than zero",
      });
    }

    // ==========================================
    // PURCHASE AIRTIME
    // ==========================================
    //
    // IMPORTANT:
    //
    // purchaseAirtime() expects ONE OBJECT.
    //
    // ==========================================

    const result =
      await purchaseAirtime({
        userId,

        network:
          network.toLowerCase(),

        phone:
          phone.trim(),

        amount:
          airtimeAmount,
      });

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json(
      result
    );
  }
);