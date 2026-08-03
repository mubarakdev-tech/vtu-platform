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
    // Read JWT from HttpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Please login.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Get logged-in user (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;

    next();

  } catch (error: any) {

    console.error("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Session expired. Please login again.",
    });

  }
};