import { Request, Response } from "express";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createToken = (id: string) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};

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
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });

};