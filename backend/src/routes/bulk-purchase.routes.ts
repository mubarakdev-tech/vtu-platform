import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  buyBulkAirtime,
  buyBulkData,
} from "../controllers/bulk-purchase.controller";

const router = Router();

/**
 * POST /api/bulk/airtime
 * Protected customer route.
 */
router.post(
  "/airtime",
  protect,
  buyBulkAirtime
);

/**
 * POST /api/bulk/data
 * Protected customer route.
 */
router.post(
  "/data",
  protect,
  buyBulkData
);

export default router;