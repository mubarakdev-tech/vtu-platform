"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [referralCode, setReferralCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // Read referral code from the registration URL.
  // Example: /auth/register?ref=ABC123
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const referralFromUrl =
      params.get("ref") || "";

    if (referralFromUrl) {
      setReferralCode(
        referralFromUrl.toUpperCase()
      );
    }
  }, []);

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      setError(
        "Please fill in all required fields."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: name.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            phone: phone.trim(),

            password,

            referralCode:
              referralCode.trim()
                ? referralCode
                    .trim()
                    .toUpperCase()
                : undefined,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Registration failed."
        );
      }

      setSuccess(
        "Account created successfully. Welcome to AbuPay!"
      );

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center px-4 py-20">

        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">

          {/* HEADER */}

          <div className="mb-6 text-center">

            <h1 className="text-2xl font-bold text-gray-900">
              Create your AbuPay account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Join AbuPay and enjoy fast and
              convenient digital payments.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            {/* NAME */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* PHONE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* REFERRAL CODE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Referral Code

                <span className="ml-1 font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) =>
                  setReferralCode(
                    e.target.value.toUpperCase()
                  )
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                If someone referred you,
                enter their referral code.
              </p>
            </div>

            {/* BUTTON */}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </Button>

          </form>

          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-gray-600">

            Already have an account?{" "}

            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:underline"
            >
              Login
            </Link>

          </p>

        </div>
      </div>
    </MainLayout>
  );
}