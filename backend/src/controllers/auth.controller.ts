import { Request, Response } from "express";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/email";
import { AuthRequest } from "../middleware/auth.middleware";

// ==========================
// CREATE JWT TOKEN
// ==========================

const createToken = (id: string) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================
// COOKIE OPTIONS
// ==========================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ==========================
// REGISTER USER
// ==========================

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
    } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Create wallet automatically
    await Wallet.create({
      user: user._id,
      balance: 0,
    });

    const token = createToken(
      user._id.toString()
    );

    // Store JWT securely
    res.cookie(
      "token",
      token,
      cookieOptions
    );

    return res.status(201).json({
      message: "User created successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// LOGIN USER
// ==========================

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(
      user._id.toString()
    );

    // Store JWT securely
    res.cookie(
      "token",
      token,
      cookieOptions
    );

    return res.status(200).json({
      message: "Login successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// GET CURRENT USER
// ==========================

export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
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
      },
    });
  } catch (error: any) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// LOGOUT USER
// ==========================

export const logout = (
  req: Request,
  res: Response
) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

// ==========================
// FORGOT PASSWORD
// ==========================

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate secure reset token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Save reset token
    user.resetPasswordToken =
      resetToken;

    // Token expires after 15 minutes
    user.resetPasswordExpires =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await user.save();

    // Password reset link
    const resetLink =
      `http://localhost:3000/reset-password/${resetToken}`;

    // Send reset email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "AbuPay Password Reset",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          "
        >

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
            Click the button below to create a
            new password:
          </p>

          <p>
            <a
              href="${resetLink}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #2563eb;
                color: #ffffff;
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
      message:
        "Password reset email sent successfully",
    });
  } catch (error: any) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// RESET PASSWORD
// ==========================

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Check token
    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    // Check password
    if (!newPassword) {
      return res.status(400).json({
        message:
          "New password is required",
      });
    }

    // Password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,

      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    user.password = hashedPassword;

    // Invalidate reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully",
    });
  } catch (error: any) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};