import { purchaseData } from "../services/data.service";

export const buyData = async (req: any, res: any) => {
  try {
    const userId = req.user;

    const { network, phone, plan, amount } = req.body;

    if (!network || !phone || !plan || !amount) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await purchaseData({
      userId,
      network,
      phone,
      plan,
      amount,
    });

    return res.status(200).json({
      success: true,
      message: "Data purchase successful",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};