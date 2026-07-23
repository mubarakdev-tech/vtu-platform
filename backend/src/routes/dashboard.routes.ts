import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.get("/", protect, getDashboard);

export default router;