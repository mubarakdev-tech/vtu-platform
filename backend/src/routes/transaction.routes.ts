import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getTransactions } from "../controllers/transaction.controller";

const router = Router();

router.get("/", protect, getTransactions);

export default router;