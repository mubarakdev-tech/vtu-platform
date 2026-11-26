import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { auditAdminActivity } from "../middleware/adminAudit.middleware";

import {
  getAdminAirtimePricing,
  updateAdminAirtimePricing,
} from "../controllers/admin-airtime-pricing.controller";

const router = Router();

router.use(protect, adminOnly, auditAdminActivity);

router.get("/", getAdminAirtimePricing);

router.patch("/:providerKey", updateAdminAirtimePricing);

export default router;
