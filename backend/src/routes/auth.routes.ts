import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  adminLogin,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from "../controllers/auth.controller";

import {
  protect,
} from "../middleware/auth.middleware";

const router = Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many admin login attempts. Try again in 15 minutes." },
});

// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
  register
);

// ==========================================
// NORMAL USER LOGIN
// ==========================================

router.post(
  "/login",
  login
);

// ==========================================
// ADMIN LOGIN
// ==========================================

router.post(
  "/admin-login",
  adminLoginLimiter,
  adminLogin
);

// ==========================================
// CURRENT USER
// ==========================================

router.get(
  "/me",
  protect,
  getMe
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

router.post(
  "/change-password",
  protect,
  changePassword
);

// ==========================================
// LOGOUT
// ==========================================

router.post(
  "/logout",
  logout
);

// ==========================================
// FORGOT PASSWORD
// ==========================================

router.post(
  "/forgot-password",
  forgotPassword
);

// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
  "/reset-password/:token",
  resetPassword
);

export default router;
