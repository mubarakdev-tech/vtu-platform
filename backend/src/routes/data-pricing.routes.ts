import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { auditAdminActivity } from "../middleware/adminAudit.middleware";

import {
  listDataPricingPlans,
  updateDataPricingPlan,
  listDataPricingProviders,
  getDataProviderCatalogue,
  mapDataPricingPlan,
  bulkMapDataPricingPlans,
} from "../controllers/data-pricing.controller";

import {
  previewBigiSubCatalogueSyncController,
} from "../controllers/provider-catalogue-sync.controller";

const router = Router();
router.use(protect, adminOnly, auditAdminActivity);

router.get(
  "/plans",
  listDataPricingPlans
);

router.patch(
  "/plans/:id",
  updateDataPricingPlan
);

router.get(
  "/providers",
  listDataPricingProviders
);

router.get(
  "/providers/:providerKey/catalogue",
  getDataProviderCatalogue
);

router.patch(
  "/plans/:id/mapping",
  mapDataPricingPlan
);

router.post(
  "/plans/bulk-mapping",
  bulkMapDataPricingPlans
);

// Read-only BigiSub catalogue sync preview
router.post(
  "/providers/bigisub/sync-preview",
  protect,
  adminOnly,
  previewBigiSubCatalogueSyncController
);

export default router;
