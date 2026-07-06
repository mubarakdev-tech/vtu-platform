import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { buyAirtime } from "../controllers/airtime.controller";

const router = Router();

// Protected airtime purchase route
router.post("/buy", protect, buyAirtime);

export default router;