"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // ======================================
      // LOGIN THROUGH AUTH CONTEXT
      // ======================================

      const loggedInUser =
        await login(
          cleanEmail,
          password
        );

      setSuccess(
        `Welcome back, ${
          loggedInUser?.name || "to AbuPay"
        }!`
      );

      // ======================================
      // GO TO DASHBOARD
      // ======================================

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error(
        "Customer login error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-md">

          {/* BRAND / SECURITY INTRO */}

          <div className="mb-6 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
              <ShieldCheck
                className="h-7 w-7 text-white"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back to AbuPay
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Login to your AbuPay account to
              manage your wallet and digital
              services.
            </p>

          </div>

          {/* LOGIN CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
                {success}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    href="/reset-password"
                    className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                  >
                    Forgot password?
                  </Link>

                </div>

                <div className="relative">

                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>
              </div>

              {/* LOGIN BUTTON */}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3"
              >
                {loading
                  ? "Signing you in..."
                  : "Login to AbuPay"}
              </Button>

            </form>

            {/* REGISTER */}

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Don't have an AbuPay account?{" "}

                <Link
                  href="/auth/register"
                  className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>

            </div>

          </div>

          {/* SECURITY NOTE */}

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Your AbuPay login is protected
            using secure authentication.
          </p>

        </div>
      </div>
    </MainLayout>
  );
}