import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * ==========================================
 * ADMIN ONLY MIDDLEWARE
 * ==========================================
 *
 * This middleware must run AFTER protect.
 *
 * protect:
 *   1. Checks the login cookie
 *   2. Verifies the JWT
 *   3. Finds the user
 *   4. Attaches the user to req.user
 *
 * adminOnly:
 *   Checks whether the authenticated user
 *   has ADMIN role.
 */

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ========================================
    // USER MUST ALREADY BE AUTHENTICATED
    // ========================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Please login.",
      });
    }

    // ========================================
    // CHECK ADMIN ROLE
    // ========================================

    const role =
      String(req.user.role || "").toUpperCase();

    if (role !== "ADMIN") {
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
      req.user.email
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