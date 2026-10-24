
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";

import {
  listDataPricingPlans,
  updateDataPricingPlan,
  listDataPricingProviders,
  getDataProviderCatalogue,
  mapDataPricingPlan,
} from "../controllers/data-pricing.controller";

const router = Router();

router.get(
  "/plans",
  protect,
  adminOnly,
  listDataPricingPlans
);

router.patch(
  "/plans/:id",
  protect,
  adminOnly,
  updateDataPricingPlan
);

router.get(
  "/providers",
  protect,
  adminOnly,
  listDataPricingProviders
);

router.get(
  "/providers/:providerKey/catalogue",
  protect,
  adminOnly,
  getDataProviderCatalogue
);

router.patch(
  "/plans/:id/mapping",
  protect,
  adminOnly,
  mapDataPricingPlan
);

export default router;
