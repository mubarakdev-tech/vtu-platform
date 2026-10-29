import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAdminCustomers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = Math.max(
      1,
      parseInt(String(req.query.page || "1"), 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(String(req.query.limit || "20"), 10) || 20
      )
    );

    const search = String(req.query.search || "").trim();

    const filter: Record<string, any> = {
      role: "user",
    };

    if (search) {
      const pattern = new RegExp(
        escapeRegex(search),
        "i"
      );

      filter.$or = [
        { name: pattern },
        { email: pattern },
        { phone: pattern },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "_id name email phone role isVerified referralCode referralCount createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const userIds = users.map(
      (user) => user._id
    );

    const wallets = await Wallet.find({
      user: {
        $in: userIds,
      },
    })
      .select("user balance")
      .lean();

    const walletMap = new Map(
      wallets.map((wallet) => [
        String(wallet.user),
        wallet,
      ])
    );

    const customers = users.map((user) => {
      const wallet =
        walletMap.get(String(user._id));

      return {
        ...user,

        wallet: {
          balance: Number(
            wallet?.balance || 0
          ),

          exists: Boolean(wallet),
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      limit,
      totalPages:
        Math.ceil(total / limit),
      customers,
    });
  } catch (error) {
    console.error(
      "Admin customer list error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve customers.",
    });
  }
};
