
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { auditAdminActivity } from "../middleware/adminAudit.middleware";
import {
  getAdminTransactions,
  adminRefundTransaction,
} from "../controllers/admin-transaction.controller";

const router = Router();

router.use(protect, adminOnly, auditAdminActivity);

router.get("/", getAdminTransactions);

router.post("/:transactionId/refund", adminRefundTransaction);

export default router;
