import { Router } from "express";

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
