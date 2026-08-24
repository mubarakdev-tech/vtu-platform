import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getDataPlans, buyData } from "../controllers/data.controller";

const router = Router();

router.get("/plans/:network", protect, getDataPlans);
router.post("/buy", protect, buyData);

export default router;