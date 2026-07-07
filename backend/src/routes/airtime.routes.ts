import { Router } from "express";
import { buyAirtime } from "../controllers/airtime.controller";
import { protect } from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { airtimeSchema } from "../validators/airtime.validator";

const router = Router();

/**
 * POST /api/airtime/buy
 * Protected Route
 */
router.post(
  "/buy",
  protect,
  validate(airtimeSchema),
  buyAirtime
);

export default router;