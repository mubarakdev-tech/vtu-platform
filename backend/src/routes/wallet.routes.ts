import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  fundWallet,
  getWalletBalance,
  transferFunds,
} from "../controllers/wallet.controller";

const router = Router();

// Wallet balance
router.get("/", protect, getWalletBalance);

// Fund wallet
router.post("/fund", protect, fundWallet);

// Transfer funds
router.post("/transfer", protect, transferFunds);

// Test JWT
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    userId: (req as any).user,
  });
});

export default router;