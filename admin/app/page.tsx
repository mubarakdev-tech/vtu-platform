"use client";

import { FormEvent, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

interface FinancialData {
  revenue: {
    total: number;
    transactions: number;
  };
  expenses: {
    total: number;
    transactions: number;
  };
  grossProfit: number;
  airtime: {
    revenue: number;
    transactions: number;
  };
  data: {
    revenue: number;
    transactions: number;
  };
  providerCosts: {
    total: number;
    transactions: number;
  };
  paystackFees: {
    total: number;
    transactions: number;
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const formatMoney = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [financialData, setFinancialData] =
    useState<FinancialData | null>(null);

  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // CHANGE PASSWORD STATES
  // ==========================================

  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changePasswordLoading, setChangePasswordLoading] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  // ==========================================
  // CHECK CURRENT LOGIN
  // ==========================================

  const checkLogin = async () => {
    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        await loadFinancialData();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(
        "Login check error:",
        error
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/auth/admin-login`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
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
            "Login failed"
        );
      }

      setUser(result.user);

      await loadFinancialData();
    } catch (error: any) {
      console.error(
        "Admin login error:",
        error
      );

      setError(
        error?.message ||
          "Unable to login"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // LOAD FINANCIAL DATA
  // ==========================================

  const loadFinancialData = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/financial-ledger/summary`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
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
            "Unable to load financial data"
        );
      }

      setFinancialData(
        result.data || null
      );
    } catch (error: any) {
      console.error(
        "Financial dashboard error:",
        error
      );

      setError(
        error?.message ||
          "Unable to load financial data"
      );
    }
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const handleChangePassword = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    // Check new password
    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    // Check confirmation
    if (
      newPassword !== confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    try {
      setChangePasswordLoading(
        true
      );

      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
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
            "Unable to change password."
        );
      }

      setPasswordMessage(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error?.message ||
          "Unable to change password."
      );
    } finally {
      setChangePasswordLoading(
        false
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    setUser(null);
    setFinancialData(null);
  };

  // ==========================================
  // INITIAL CHECK
  // ==========================================

  useEffect(() => {
    checkLogin();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-sm font-medium text-slate-300">
            Loading AbuPay Admin...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  if (!user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative w-full max-w-md">

          <div className="mb-8 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-900/30">

              <span className="text-2xl font-black text-white">
                A
              </span>

            </div>

            <p className="text-sm font-bold tracking-widest text-blue-400">
              ABUPAY
            </p>

            <h1 className="mt-3 text-3xl font-bold text-white">
              Admin Portal
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Secure access to your financial dashboard
            </p>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/10"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loginLoading
                }
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loginLoading
                  ? "Signing in..."
                  : "Sign in to Admin"}
              </button>

            </form>

          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            AbuPay secure administration portal
          </p>

        </div>
      </main>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">

              <span className="font-black text-white">
                A
              </span>

            </div>

            <div>

              <p className="text-sm font-bold tracking-wide text-blue-600">
                ABUPAY
              </p>

              <h1 className="text-xl font-bold">
                Admin Dashboard
              </h1>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold">
                {user.name}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>

            </div>

            <button
              onClick={() =>
                setShowChangePassword(
                  !showChangePassword
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Change Password
            </button>

            <button
              onClick={loadFinancialData}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* CHANGE PASSWORD PANEL */}

      {showChangePassword && (
        <section className="border-b border-slate-200 bg-white">

          <div className="mx-auto max-w-7xl px-6 py-8">

            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="mb-6">

                <h2 className="text-xl font-bold text-slate-900">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the password for your AbuPay administrator account.
                </p>

              </div>

              {passwordMessage && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <p className="text-sm font-semibold text-emerald-700">
                    ✓ {passwordMessage}
                  </p>

                </div>
              )}

              {passwordError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-700">
                    {passwordError}
                  </p>

                </div>
              )}

              <form
                onSubmit={
                  handleChangePassword
                }
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={
                      currentPassword
                    }
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    required
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Password must contain at least 6 characters.
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    required
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    type="submit"
                    disabled={
                      changePasswordLoading
                    }
                    className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {changePasswordLoading
                      ? "Changing..."
                      : "Change Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(
                        false
                      );

                      setPasswordError(
                        ""
                      );

                      setPasswordMessage(
                        ""
                      );
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          </div>

        </section>
      )}

      {/* DASHBOARD */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600">
            Dashboard / Financial Overview
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Financial Overview
          </h2>

          <p className="mt-2 text-slate-500">
            Monitor AbuPay revenue, expenses,
            provider costs and transaction activity.
          </p>

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="font-semibold text-red-700">
              Unable to load financial data
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

          </div>
        )}

        {!financialData &&
          !error && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="text-slate-500">
                Loading financial data...
              </p>

            </div>
          )}

        {financialData && (
          <>

            {/* FINANCIAL CARDS */}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Recorded Revenue
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {formatMoney(
                    financialData
                      .revenue.total
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {
                    financialData
                      .revenue
                      .transactions
                  }{" "}
                  revenue transactions
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Recorded Expenses
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {formatMoney(
                    financialData
                      .expenses.total
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {
                    financialData
                      .expenses
                      .transactions
                  }{" "}
                  expense transactions
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Financial Result
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {formatMoney(
                    financialData
                      .grossProfit
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Revenue minus recorded expenses
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Paystack Fees
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {formatMoney(
                    financialData
                      .paystackFees.total
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {
                    financialData
                      .paystackFees
                      .transactions
                  }{" "}
                  recorded fees
                </p>

              </div>

            </div>

            {/* SERVICE REVENUE */}

            <div className="mt-10">

              <div className="mb-4">

                <h2 className="text-xl font-bold">
                  Service Revenue
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Revenue generated from AbuPay services.
                </p>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <p className="text-sm font-medium text-slate-500">
                    Airtime
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(
                      financialData
                        .airtime
                        .revenue
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {
                      financialData
                        .airtime
                        .transactions
                    }{" "}
                    transactions
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <p className="text-sm font-medium text-slate-500">
                    Data
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(
                      financialData
                        .data
                        .revenue
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {
                      financialData
                        .data
                        .transactions
                    }{" "}
                    transactions
                  </p>

                </div>

              </div>

            </div>

            {/* PROVIDER COSTS */}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold">
                Provider Costs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Costs recorded from service providers.
              </p>

              <p className="mt-4 text-3xl font-bold">
                {formatMoney(
                  financialData
                    .providerCosts
                    .total
                )}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {
                  financialData
                    .providerCosts
                    .transactions
                }{" "}
                recorded provider-cost transactions
              </p>

            </div>

          </>
        )}

      </section>

    </main>
  );
}