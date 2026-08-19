import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export interface AuthRequest extends Request {
  user?: any;
}

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ==========================================
    // GET TOKEN FROM HTTP-ONLY COOKIE
    // ==========================================

    const token = req.cookies?.token;

    if (!token) {
      console.log("AUTH ERROR: No token cookie found");

      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // ==========================================
    // CHECK JWT SECRET
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error("AUTH ERROR: JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
    }

    // ==========================================
    // VERIFY TOKEN
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtPayload;

    if (!decoded?.id) {
      console.log("AUTH ERROR: Invalid token payload");

      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      console.log(
        "AUTH ERROR: User not found:",
        decoded.id
      );

      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==========================================
    // ATTACH USER TO REQUEST
    // ==========================================

    req.user = user;

    console.log(
      "AUTH SUCCESS:",
      user.email
    );

    next();
  } catch (error: any) {
    console.error(
      "JWT ERROR:",
      error?.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Session expired. Please login again.",
    });
  }
};