import { Router } from "express";
import {
  getMyWallet,
  initializeFunding,
  verifyFunding,
} from "../controllers/wallet.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, getMyWallet);
router.post("/fund/initialize", protect, initializeFunding);
router.post("/fund/verify", protect, verifyFunding);

export default router;