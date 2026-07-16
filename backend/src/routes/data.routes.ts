import { Router } from "express";

import {
  buyData,
  getDataPlans
} from "../controllers/data.controller";

import { protect } from "../middleware/auth.middleware";


const router = Router();


/**
 * GET DATA PLANS
 * Example:
 * GET /api/data/plans/mtn
 */
router.get(
  "/plans/:network",
  protect,
  getDataPlans
);



/**
 * BUY DATA
 * POST /api/data/buy
 */
router.post(
  "/buy",
  protect,
  buyData
);



export default router;