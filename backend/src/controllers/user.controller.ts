import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";
import { AuthRequest } from "../middleware/auth.middleware";
import cloudinary from "../config/cloudinary";

// ==========================
// GET PROFILE
// ==========================
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get wallet balance (create if missing)
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
      });
    }

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      walletBalance: wallet.balance,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// UPDATE PROFILE
// ==========================
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user?._id || req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update name
    if (name) {
      user.name = name;
    }

    // Update phone
    if (phone) {
      user.phone = phone;
    }

    // ==========================
    // UPLOAD PROFILE PICTURE
    // ==========================
    if (req.file) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "abupay/profile-pictures",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file?.buffer);
      });

      user.profilePicture = uploadResult.secure_url;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// CHANGE PASSWORD
// ==========================
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id || req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};