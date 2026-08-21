import { Request, Response } from "express";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/email";
import { AuthRequest } from "../middleware/auth.middleware";

// ==========================================
// CREATE JWT
// ==========================================

const createToken = (id: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// COOKIE OPTIONS
// ==========================================

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  maxAge:
    7 * 24 * 60 * 60 * 1000,
};

// ==========================================
// GENERATE UNIQUE REFERRAL CODE
// ==========================================

const generateUniqueReferralCode =
  async (): Promise<string> => {
    let referralCode = "";
    let exists = true;

    while (exists) {
      referralCode =
        `ABU${crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase()}`;

      const existing =
        await User.findOne({
          referralCode,
        });

      exists = !!existing;
    }

    return referralCode;
  };

// ==========================================
// REGISTER
// ==========================================

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      referralCode,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    // ========================================
    // NORMALIZE INPUT
    // ========================================

    const cleanName =
      String(name).trim();

    const cleanEmail =
      String(email)
        .toLowerCase()
        .trim();

    const cleanPhone =
      String(phone).trim();

    const cleanReferralCode =
      typeof referralCode === "string"
        ? referralCode
            .trim()
            .toUpperCase()
        : "";

    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists.",
      });
    }

    // ========================================
    // FIND REFERRING USER
    // ========================================

    let referringUser =
      null;

    if (cleanReferralCode) {
      referringUser =
        await User.findOne({
          referralCode:
            cleanReferralCode,
        });

      if (!referringUser) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid referral code.",
        });
      }
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // ========================================
    // GENERATE NEW CUSTOMER REFERRAL CODE
    // ========================================

    const newReferralCode =
      await generateUniqueReferralCode();

    // ========================================
    // CREATE USER
    // ========================================

    const user = await User.create({
      name: cleanName,

      email: cleanEmail,

      phone: cleanPhone,

      password: hashedPassword,

      role: "user",

      isVerified: false,

      referralCode:
        newReferralCode,

      referredBy:
        referringUser
          ? referringUser._id
          : null,

      referralCount: 0,
    });

    // ========================================
    // CREATE WALLET
    // ========================================

    await Wallet.create({
      user: user._id,
      balance: 0,
    });

    // ========================================
    // RECORD REFERRAL
    // ========================================

    if (referringUser) {
      await User.findByIdAndUpdate(
        referringUser._id,
        {
          $inc: {
            referralCount: 1,
          },
        }
      );

      console.log(
        "================================="
      );

      console.log(
        "REFERRAL RECORDED"
      );

      console.log(
        "Referrer:",
        referringUser.email
      );

      console.log(
        "New customer:",
        user.email
      );

      console.log(
        "Referral code:",
        cleanReferralCode
      );

      console.log(
        "================================="
      );
    }

    // ========================================
    // CREATE LOGIN TOKEN
    // ========================================

    const token = createToken(
      user._id.toString()
    );

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message:
        "User created successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,

        referralCode:
          user.referralCode,

        referralCount:
          user.referralCount,
      },
    });
  } catch (error: any) {
    console.error(
      "Register error:",
      error
    );

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

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const user =
      await User.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const token = createToken(
      user._id.toString()
    );

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    return res.status(200).json({
      success: true,

      message:
        "Login successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,

        referralCode:
          user.referralCode ||
          null,

        referralCount:
          user.referralCount ||
          0,
      },
    });
  } catch (error: any) {
    console.error(
      "Login error:",
      error
    );

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

export const adminLogin = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const user =
      await User.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (
      user.role !== "admin" &&
      user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const token = createToken(
      user._id.toString()
    );

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    return res.status(200).json({
      success: true,

      message:
        "Admin login successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,

        referralCode:
          user.referralCode ||
          null,

        referralCount:
          user.referralCount ||
          0,
      },
    });
  } catch (error: any) {
    console.error(
      "Admin login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================

export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Please login.",
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

        referralCode:
          req.user.referralCode ||
          null,

        referralCount:
          req.user.referralCount ||
          0,
      },
    });
  } catch (error: any) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = (
  req: Request,
  res: Response
) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message:
      "Logged out successfully",
  });
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { email } =
        req.body;

      const user =
        await User.findOne({
          email:
            email
              ?.toLowerCase()
              .trim(),
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      user.resetPasswordToken =
        resetToken;

      user.resetPasswordExpires =
        new Date(
          Date.now() +
            15 * 60 * 1000
        );

      await user.save();

      const resetLink =
        `http://localhost:3000/reset-password/${resetToken}`;

      await transporter.sendMail({
        from:
          process.env.EMAIL_USER,

        to: user.email,

        subject:
          "AbuPay Password Reset",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          ">

            <h2 style="color: #2563eb;">
              AbuPay Password Reset
            </h2>

            <p>
              Hello ${user.name},
            </p>

            <p>
              We received a request to reset your
              AbuPay password.
            </p>

            <p>
              Click the button below to create
              a new password:
            </p>

            <p>
              <a
                href="${resetLink}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background-color: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This password reset link will expire
              in 15 minutes.
            </p>

            <p>
              If you did not request a password
              reset, you can safely ignore this email.
            </p>

            <p>
              Regards,<br />
              <strong>AbuPay Team</strong>
            </p>

          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message:
          "Password reset email sent successfully",
      });
    } catch (error: any) {
      console.error(
        "Forgot password error:",
        error
      );

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

export const resetPassword =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { token } =
        req.params;

      const {
        newPassword,
      } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token is required",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password is required",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      const user =
        await User.findOne({
          resetPasswordToken:
            token,

          resetPasswordExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset token",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.password =
        hashedPassword;

      user.resetPasswordToken =
        null;

      user.resetPasswordExpires =
        null;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error: any) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Not authorized. Please login.",
        });
      }

      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and new password are required.",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 6 characters.",
        });
      }

      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const isMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Current password is incorrect.",
        });
      }

      const samePassword =
        await bcrypt.compare(
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

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.password =
        hashedPassword;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Password changed successfully.",
      });
    } catch (error: any) {
      console.error(
        "Change password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  };