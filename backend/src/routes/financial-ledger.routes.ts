import { Router } from "express";
import { getFinancialSummary } from "../controllers/financial-ledger.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";

const router = Router();

// =====================================================
// FINANCIAL SUMMARY — ADMIN ONLY
// =====================================================
//
// Authentication:
// protect → confirms the user is logged in
//
// Authorization:
// adminOnly → confirms the user has ADMIN role
//
// Endpoint:
// GET /api/financial-ledger/summary
// =====================================================

router.get(
  "/summary",
  protect,
  adminOnly,
  getFinancialSummary
);

export default router;