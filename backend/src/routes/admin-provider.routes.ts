import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";

import {
  getAdminProviders,
  getProviderBalances,
  setActiveAirtimeProvider,
  setActiveDataProvider,
} from "../controllers/admin-provider.controller";

const router = Router();

router.use(protect, adminOnly);

// List providers and current routing status
router.get("/", getAdminProviders);

// Read provider wallet balances for admin financial control
router.get("/balances", getProviderBalances);

// Select the provider AbuPay will use for Airtime
router.patch(
  "/:providerKey/airtime",
  setActiveAirtimeProvider
);

// Select the provider AbuPay will use for Data
router.patch(
  "/:providerKey/data",
  setActiveDataProvider
);

export default router;
