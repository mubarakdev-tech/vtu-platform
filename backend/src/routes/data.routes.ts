import { Router } from "express";
import { buyData } from "../controllers/data.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

/**
 * BUY DATA
 * POST /data/buy
 */
router.post("/buy", protect, buyData);

export default router;