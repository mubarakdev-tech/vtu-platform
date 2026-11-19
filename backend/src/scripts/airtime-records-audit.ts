import mongoose from "mongoose";
import env from "../config/env";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";

(async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    const users = await User.find({
      role: "user",
      isTest: { $ne: true }
    }).select("_id").lean();

    const rows = await Transaction.find({
      user: { $in: users.map((u: any) => u._id) },
      type: "DEBIT",
      status: "SUCCESS",
      category: "AIRTIME",
      "metadata.isTest": { $ne: true }
    })
      .select("_id createdAt amount metadata")
      .sort({ createdAt: 1 })
      .lean();

    const report = rows.map((t: any) => ({
      id: String(t._id),
      date: t.createdAt,
      amount: t.amount,
      network: t.metadata?.network,
      provider: t.metadata?.provider,
      phoneLast4: String(t.metadata?.phone || "").slice(-4),
      providerResponse: t.metadata?.providerResponse
        ? {
            provider: t.metadata.providerResponse.provider,
            success: t.metadata.providerResponse.success,
            message: t.metadata.providerResponse.message,
            data: t.metadata.providerResponse.data
          }
        : null
    }));

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();

