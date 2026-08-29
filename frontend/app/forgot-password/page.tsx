"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(
        "Please enter your email address."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setSent(true);

      toast.success(
        "Password reset email sent successfully."
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to reset your AbuPay password"
    >
      <AuthCard>

        {sent ? (
          <div className="space-y-5 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-2xl">
                ✓
              </span>
            </div>

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Check your email
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                We have sent a password reset link to:
              </p>

              <p className="mt-1 break-all font-medium text-blue-600">
                {email}
              </p>

            </div>

            <p className="text-sm text-gray-500">
              The reset link will expire in 15 minutes.
            </p>

            <Link
              href="/login"
              className="inline-block font-semibold text-blue-600 hover:underline"
            >
              Back to Login
            </Link>

          </div>
        ) : (

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <AuthInput
              label="Email Address"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <p className="text-sm leading-6 text-gray-500">
              Enter the email address associated with
              your AbuPay account and we will send you
              a password reset link.
            </p>

            <AuthButton
              loading={loading}
            >
              Send Reset Link
            </AuthButton>

            <p className="pt-3 text-center text-sm text-gray-600">

              Remember your password?

              <Link
                href="/login"
                className="ml-1 font-semibold text-blue-600 hover:underline"
              >
                Back to Login
              </Link>

            </p>

          </form>

        )}

      </AuthCard>
    </AuthLayout>
  );
}