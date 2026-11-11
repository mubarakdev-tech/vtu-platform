
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { getAdminTransactions, adminRefundTransaction } from "../controllers/admin-transaction.controller";

const router = Router();

router.use(protect, adminOnly);
router.get("/", getAdminTransactions);

router.post('/:transactionId/refund', adminRefundTransaction);

export default router;
