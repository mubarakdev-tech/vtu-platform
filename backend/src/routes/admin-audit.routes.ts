import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { getAdminAuditLogs } from "../controllers/admin-audit.controller";

const router = Router();
router.use(protect, adminOnly);
router.get("/", getAdminAuditLogs);
export default router;
