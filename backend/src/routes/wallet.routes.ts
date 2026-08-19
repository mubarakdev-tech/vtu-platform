import { Router } from "express";

import {
  getMyWallet,
  calculateFundingFee,
  initializeFunding,
  verifyFunding,
} from "../controllers/wallet.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// GET WALLET
// ==========================================

router.get(
  "/",
  protect,
  getMyWallet
);

// ==========================================
// CALCULATE FUNDING FEE
// ==========================================
//
// Returns the estimated Paystack fee
// before the customer makes payment.
//
// Example:
// GET /api/wallet/fund/fee?amount=1000
//
// ==========================================

router.get(
  "/fund/fee",
  protect,
  calculateFundingFee
);

// ==========================================
// INITIALIZE FUNDING
// ==========================================

router.post(
  "/fund/initialize",
  protect,
  initializeFunding
);

// ==========================================
// VERIFY FUNDING
// ==========================================

router.post(
  "/fund/verify",
  protect,
  verifyFunding
);

export default router;