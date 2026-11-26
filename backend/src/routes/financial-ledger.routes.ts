
import { Router } from "express";
import {
  getFinancialSummary,
  getFinancialEntries,
} from "../controllers/financial-ledger.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { auditAdminActivity } from "../middleware/adminAudit.middleware";

const router = Router();
router.use(protect, adminOnly, auditAdminActivity);

// =====================================================
// FINANCIAL SUMMARY — ADMIN ONLY
// GET /api/financial-ledger/summary
// =====================================================

router.get(
  "/summary",
  getFinancialSummary
);

// =====================================================
// FINANCIAL LEDGER ENTRIES — ADMIN ONLY
// GET /api/financial-ledger/entries
// Read-only, paginated ledger records
// =====================================================

router.get(
  "/entries",
  protect,
  adminOnly,
  getFinancialEntries
);

export default router;
