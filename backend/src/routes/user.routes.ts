import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import upload from "../middleware/upload.middleware";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller";

const router = Router();

// Get Profile
router.get("/profile", protect, getProfile);

// Update Profile + Profile Image
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);

// Change Password
router.put("/change-password", protect, changePassword);

export default router;