"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Camera,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  Lock,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAuth from "@/hooks/useAuth";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "@/services/user";

// ======================
// VALIDATION SCHEMAS
// ======================
const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  phone: z
    .string()
    .regex(/^(\+?234|0)?[789][01]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Load profile
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        resetProfile({
          name: data.name || "",
          phone: data.phone || "",
        });
        setPreview(data.profilePicture || null);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) load();
  }, [authLoading, resetProfile]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side security checks
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Update profile
  const onUpdateProfile = async (values: ProfileFormValues) => {
    try {
      setSavingProfile(true);

      const formData = new FormData();
      formData.append("name", values.name.trim());
      if (values.phone) formData.append("phone", values.phone.trim());
      if (selectedFile) formData.append("profileImage", selectedFile);

      const result = await updateProfile(formData);

      toast.success(result.message || "Profile updated successfully");
      setSelectedFile(null);
      await refreshUser(); // keep AuthContext in sync
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const onChangePassword = async (values: PasswordFormValues) => {
    try {
      setSavingPassword(true);

      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success("Password changed successfully");
      resetPassword();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="mt-4 text-gray-500">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-500">
            Manage your personal information and account security
          </p>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-0 shadow-md">
          {/* Gradient Header */}
          <div className="relative h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500">
            <div className="absolute -bottom-12 left-6 md:left-8">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-100 shadow-lg">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-emerald-600" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
                >
                  <Camera size={14} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <CardContent className="pt-16 pb-6">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.name || "AbuPay User"}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <div className="mt-3 flex items-center gap-2 md:mt-0">
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={14} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    <Shield size={14} />
                    Unverified
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                  {user?.role || "user"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon size={18} className="text-emerald-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your name and phone number
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleProfileSubmit(onUpdateProfile)}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    {...registerProfile("name")}
                    className="h-11"
                  />
                  {profileErrors.name && (
                    <p className="text-sm text-red-500">
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="h-11 cursor-not-allowed bg-slate-50 pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Email cannot be changed for security reasons
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      id="phone"
                      placeholder="e.g. 08012345678"
                      {...registerProfile("phone")}
                      className="h-11 pl-10"
                    />
                  </div>
                  {profileErrors.phone && (
                    <p className="text-sm text-red-500">
                      {profileErrors.phone.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={savingProfile}
                  fullWidth
                  className="mt-2"
                >
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security - Change Password */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock size={18} className="text-emerald-600" />
                Security
              </CardTitle>
              <CardDescription>
                Change your password regularly to keep your account safe
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handlePasswordSubmit(onChangePassword)}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("currentPassword")}
                    className="h-11"
                    autoComplete="current-password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("newPassword")}
                    className="h-11"
                    autoComplete="new-password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("confirmPassword")}
                    className="h-11"
                    autoComplete="new-password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={savingPassword}
                  fullWidth
                  variant="secondary"
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}