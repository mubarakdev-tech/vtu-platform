
import { Request, Response } from "express";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/email";
import env from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from "../utils/passwordPolicy";
import { writeAdminAuditLog, writeAdminLoginFailureLog } from "../utils/adminAudit";

// ==========================================
// CREATE JWT
// ==========================================
const createToken = (id: string, tokenVersion = 0) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ==========================================
// COOKIE OPTIONS
// ==========================================
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ==========================================
// GENERATE UNIQUE REFERRAL CODE
// ==========================================
const generateUniqueReferralCode = async (): Promise<string> => {
  let referralCode = "";
  let exists = true;

  while (exists) {
    referralCode = `ABU${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const existing = await User.findOne({ referralCode });
    exists = !!existing;
  }

  return referralCode;
};

// ==========================================
// REGISTER
// ==========================================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_POLICY_MESSAGE,
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPhone = String(phone).trim();

    const cleanReferralCode =
      typeof referralCode === "string"
        ? referralCode.trim().toUpperCase()
        : "";

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    let referringUser = null;

    if (cleanReferralCode) {
      referringUser = await User.findOne({
        referralCode: cleanReferralCode,
      });

      if (!referringUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = await generateUniqueReferralCode();

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      referralCode: newReferralCode,
      referredBy: referringUser ? referringUser._id : null,
      referralCount: 0,
    });

    await Wallet.create({
      user: user._id,
      balance: 0,
    });

    if (referringUser) {
      await User.findByIdAndUpdate(referringUser._id, {
        $inc: { referralCount: 1 },
      });
    }

    const token = createToken(
      user._id.toString(),
      user.tokenVersion ?? 0
    );

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// NORMAL USER LOGIN
// ==========================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(
      user._id.toString(),
      user.tokenVersion ?? 0
    );

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode || null,
        referralCount: user.referralCount || 0,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN LOGIN
// ==========================================
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      await writeAdminLoginFailureLog({
        email,
        failureReason: "ACCOUNT_NOT_FOUND",
        statusCode: 401,
        req,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      await writeAdminLoginFailureLog({
        email,
        failureReason: "NOT_ADMIN",
        statusCode: 403,
        req,
      });
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await writeAdminLoginFailureLog({
        email,
        failureReason: "INVALID_PASSWORD",
        statusCode: 401,
        req,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(
      user._id.toString(),
      user.tokenVersion ?? 0
    );

    // Audit logging must not prevent a valid administrator from logging in.
    try {
      await writeAdminAuditLog({
        actor: user,
        action: "ADMIN_LOGIN",
        resource: "/api/auth/admin-login",
        method: "POST",
        statusCode: 200,
        req,
      });
    } catch (auditError) {
      console.error("Admin login audit write failed:", auditError);
    }

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode || null,
        referralCount: user.referralCount || 0,
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        referralCode: req.user.referralCode || null,
        referralCount: req.user.referralCount || 0,
      },
    });
  } catch (error: any) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================
export const logout = async (req: Request, res: Response) => {
  let revocationFailed = false;

  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.slice(7).trim()
      : req.cookies?.token;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        ) as { id?: string };

        if (decoded.id) {
          const user = await User.findById(decoded.id);

          if (user) {
            user.tokenVersion = (user.tokenVersion ?? 0) + 1;
            await user.save();

            if (user.role === "admin" || user.role === "super_admin") {
              try {
                await writeAdminAuditLog({
                  actor: user,
                  action: "ADMIN_LOGOUT",
                  resource: "/api/auth/logout",
                  method: "POST",
                  statusCode: 200,
                  req,
                });
              } catch (auditError) {
                console.error(
                  "Admin logout audit write failed:",
                  auditError
                );
              }
            }
          }
        }
      } catch (error: any) {
        if (
          error?.name !== "TokenExpiredError" &&
          error?.name !== "JsonWebTokenError" &&
          error?.name !== "NotBeforeError"
        ) {
          revocationFailed = true;
          console.error("Logout session revocation failed:", error);
        }
      }
    }
  } catch (error) {
    revocationFailed = true;
    console.error("Logout session revocation failed:", error);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  });

  if (revocationFailed) {
    return res.status(500).json({
      success: false,
      message:
        "The browser session was cleared, but server-side session revocation could not be confirmed.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!transporter || !env.EMAIL_FROM) {
      console.error(
        "Password reset email unavailable: Resend is not configured."
      );

      return res.status(503).json({
        success: false,
        message:
          "Password reset email is temporarily unavailable. Please try again later.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";

    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const emailResult = await transporter.emails.send({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: "AbuPay Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #059669;">AbuPay Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your AbuPay password.</p>
          <p>Click the button below to create a new password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </p>
          <p>This password reset link will expire in 15 minutes.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>Regards,<br /><strong>AbuPay Team</strong></p>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error("Resend email error:", emailResult.error);

      return res.status(500).json({
        success: false,
        message: "Unable to send password reset email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_POLICY_MESSAGE,
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: { $in: [resetTokenHash, token] },
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    if (user.role === "admin" || user.role === "super_admin") {
      try {
        await writeAdminAuditLog({
          actor: user,
          action: "ADMIN_PASSWORD_RESET",
          resource: "/api/auth/reset-password",
          method: "POST",
          statusCode: 200,
          req,
        });
      } catch (auditError) {
        console.error(
          "Admin password-reset audit write failed:",
          auditError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================
export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_POLICY_MESSAGE,
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;

    await user.save();

    res.clearCookie("token", { ...cookieOptions });

    if (user.role === "admin" || user.role === "super_admin") {
      try {
        await writeAdminAuditLog({
          actor: user,
          action: "ADMIN_PASSWORD_CHANGED",
          resource: "/api/auth/change-password",
          method: "POST",
          statusCode: 200,
          req,
        });
      } catch (auditError) {
        console.error(
          "Admin password-change audit write failed:",
          auditError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
