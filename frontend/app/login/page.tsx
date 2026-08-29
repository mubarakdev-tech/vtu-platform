"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";

import { loginSchema } from "@/schemas/authSchema";
import useAuth from "@/hooks/useAuth";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const { login, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(
        data.email,
        data.password
      );

      toast.success(
        "Welcome back to AbuPay!"
      );

      router.push("/dashboard");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to your AbuPay account"
    >
      <AuthCard>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-2"
        >

          <AuthInput
            label="Email Address"
            type="email"
            placeholder="example@email.com"
            {...register("email")}
            error={errors.email?.message}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="mb-5 flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 text-gray-600">

              <input
                type="checkbox"
                className="rounded"
              />

              Remember me

            </label>

            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>

          </div>

          <AuthButton
            loading={loading}
          >
            Login Securely
          </AuthButton>

          <p className="pt-5 text-center text-sm text-gray-600">

            Don't have an account?

            <Link
              href="/register"
              className="ml-1 font-semibold text-blue-600 hover:underline"
            >
              Create Account
            </Link>

          </p>

        </form>

      </AuthCard>
    </AuthLayout>
  );
}