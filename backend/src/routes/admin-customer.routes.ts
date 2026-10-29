import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { getAdminCustomers } from "../controllers/admin-customer.controller";

const router = Router();

router.use(protect, adminOnly);

router.get("/", getAdminCustomers);

export default router;
