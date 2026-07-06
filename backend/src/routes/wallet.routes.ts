import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getWallet, fundWallet } from "../controllers/wallet.controller";

const router = Router();

router.get("/", protect, getWallet);

router.post("/fund", protect, fundWallet);

export default router;