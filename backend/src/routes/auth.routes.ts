import { Router } from "express";

import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/auth.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

// ==========================
// REGISTER
// ==========================

router.post(
  "/register",
  register
);

// ==========================
// LOGIN
// ==========================

router.post(
  "/login",
  login
);

// ==========================
// CURRENT USER
// ==========================

router.get(
  "/me",
  protect,
  getMe
);

// ==========================
// LOGOUT
// ==========================

router.post(
  "/logout",
  logout
);

// ==========================
// FORGOT PASSWORD
// ==========================

router.post(
  "/forgot-password",
  forgotPassword
);

// ==========================
// RESET PASSWORD
// ==========================

router.post(
  "/reset-password/:token",
  resetPassword
);

export default router;