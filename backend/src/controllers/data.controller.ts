import { Response } from "express";
import { purchaseData } from "../services/data.service";
import { vtpassProvider } from "../providers/vtpass/vtpass.provider";

export const buyData = async (
  req: any,
  res: Response
) => {

  console.log("🔥🔥 BUY DATA CONTROLLER HIT");

  try {

    console.log("🔥 DATA CONTROLLER REACHED");

    console.log("🔥 USER:", req.user);

    const userId = req.user;

    console.log("🔥 DATA PURCHASE USER ID:", userId);

    const {
      network,
      phone,
      plan,
      amount,
    } = req.body;

    console.log("🔥 DATA REQUEST BODY:", {
      network,
      phone,
      plan,
      amount,
    });

    if (!network || !phone || !plan || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    console.log("🔥 CALLING purchaseData()...");

    const result = await purchaseData({
      userId,
      network,
      phone,
      plan,
      amount: Number(amount),
    });

    console.log("🔥 purchaseData() RETURNED");

    console.log("🔥 DATA PURCHASE RESULT:", result);

    return res.status(200).json(result);

  } catch (error: any) {

    console.log("🔥🔥 BUY DATA CONTROLLER CATCH");

    console.log("🔥 FULL ERROR:", error);

    console.log("🔥 MESSAGE:", error.message);

    console.log("🔥 STACK:", error.stack);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "UNKNOWN ERROR",
      error: error.stack,
    });

  }

};

export const getDataPlans = async (
  req: any,
  res: Response
) => {

  try {

    const { network } = req.params;

    if (!network) {
      return res.status(400).json({
        success: false,
        message: "Network is required",
      });
    }

    const result =
      await vtpassProvider.getDataPlans(network);

    return res.status(200).json(result);

  } catch (error: any) {

    console.log("🔥 GET DATA PLANS ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};