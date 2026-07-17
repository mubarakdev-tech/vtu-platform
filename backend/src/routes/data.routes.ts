import { Router } from "express";
import { buyData, getDataPlans } from "../controllers/data.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();


router.get(
  "/plans/:network",
  protect,
  getDataPlans
);


router.post(
  "/buy",
  protect,
  buyData
);


export default router;