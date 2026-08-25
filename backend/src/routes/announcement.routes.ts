import express from "express";

import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "../controllers/announcement.controller";

import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";

const router =
  express.Router();

// =====================================================
// PUBLIC ANNOUNCEMENTS
// =====================================================
//
// GET /api/announcements
//
// No login required.
//
// Customer frontend can use this endpoint.
//
// =====================================================

router.get(
  "/",
  getAnnouncements
);

// =====================================================
// ADMIN ANNOUNCEMENTS
// =====================================================
//
// Everything below this point requires:
//
// 1. Valid login
// 2. Admin or super_admin role
//
// =====================================================

router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllAnnouncements
);

// =====================================================
// CREATE
// =====================================================
//
// POST /api/announcements
//
// =====================================================

router.post(
  "/",
  protect,
  adminOnly,
  createAnnouncement
);

// =====================================================
// GET SINGLE
// =====================================================
//
// GET /api/announcements/:id
//
// =====================================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getAnnouncementById
);

// =====================================================
// UPDATE
// =====================================================
//
// PUT /api/announcements/:id
//
// =====================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateAnnouncement
);

// =====================================================
// DELETE
// =====================================================
//
// DELETE /api/announcements/:id
//
// =====================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteAnnouncement
);

// =====================================================
// CHANGE STATUS
// =====================================================
//
// PATCH /api/announcements/:id/status
//
// =====================================================

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  toggleAnnouncementStatus
);

// =====================================================
// EXPORT
// =====================================================

export default router;
