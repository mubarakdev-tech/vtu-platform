import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * ==========================================
 * ADMIN ONLY MIDDLEWARE
 * ==========================================
 *
 * Must run AFTER protect.
 *
 * protect:
 * - verifies login
 * - verifies JWT
 * - finds user
 * - attaches req.user
 *
 * adminOnly:
 * - allows admin
 * - allows super_admin
 * - rejects normal users
 */

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ========================================
    // USER MUST BE AUTHENTICATED
    // ========================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // ========================================
    // CHECK USER ROLE
    // ========================================

    const role = String(
      req.user.role || ""
    ).toLowerCase();

    // ========================================
    // ADMIN OR SUPER ADMIN ONLY
    // ========================================

    if (
      role !== "admin" &&
      role !== "super_admin"
    ) {
      console.log(
        "ADMIN ACCESS DENIED:",
        req.user.email,
        "Role:",
        req.user.role
      );

      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required.",
      });
    }

    // ========================================
    // ADMIN VERIFIED
    // ========================================

    console.log(
      "ADMIN ACCESS GRANTED:",
      req.user.email,
      "Role:",
      req.user.role
    );

    next();
  } catch (error) {
    console.error(
      "ADMIN AUTHORIZATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify admin authorization.",
    });
  }
};