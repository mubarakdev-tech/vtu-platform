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

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const formatMoney = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
  // ANNOUNCEMENT STATES
  // ==========================================

  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [announcementTitle, setAnnouncementTitle] =
    useState("");

  const [announcementMessage, setAnnouncementMessage] =
    useState("");

  const [announcementType, setAnnouncementType] =
    useState<
      "INFO" | "SUCCESS" | "WARNING" | "ERROR"
    >("INFO");

  const [announcementLoading, setAnnouncementLoading] =
    useState(false);

  const [announcementError, setAnnouncementError] =
    useState("");

  const [announcementSuccess, setAnnouncementSuccess] =
    useState("");

  const [announcementRefreshing, setAnnouncementRefreshing] =
    useState(false);

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

      const result = await response.json();

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
  // LOAD ANNOUNCEMENTS
  // ==========================================

  const loadAnnouncements = async () => {
    try {
      setAnnouncementError("");

      const response = await fetch(
        `${API_URL}/announcements`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to load announcements"
        );
      }

      setAnnouncements(
        result.announcements || []
      );
    } catch (error: any) {
      console.error(
        "Announcement loading error:",
        error
      );

      setAnnouncementError(
        error?.message ||
          "Unable to load announcements"
      );
    }
  };

  // ==========================================
  // REFRESH ANNOUNCEMENTS
  // ==========================================

  const refreshAnnouncements = async () => {
    try {
      setAnnouncementRefreshing(true);

      await loadAnnouncements();
    } finally {
      setAnnouncementRefreshing(false);
    }
  };

  // ==========================================
  // CREATE ANNOUNCEMENT
  // ==========================================

  const handleCreateAnnouncement = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setAnnouncementError("");
    setAnnouncementSuccess("");

    if (!announcementTitle.trim()) {
      setAnnouncementError(
        "Please enter an announcement title."
      );
      return;
    }

    if (!announcementMessage.trim()) {
      setAnnouncementError(
        "Please enter an announcement message."
      );
      return;
    }

    try {
      setAnnouncementLoading(true);

      const response = await fetch(
        `${API_URL}/announcements`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title: announcementTitle.trim(),
            message: announcementMessage.trim(),
            type: announcementType,
          }),
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to create announcement."
        );
      }

      setAnnouncementSuccess(
        "Announcement published successfully."
      );

      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementType("INFO");

      await loadAnnouncements();
    } catch (error: any) {
      console.error(
        "Announcement creation error:",
        error
      );

      setAnnouncementError(
        error?.message ||
          "Unable to create announcement."
      );
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // ==========================================
  // DELETE ANNOUNCEMENT
  // ==========================================

  const handleDeleteAnnouncement = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this announcement?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setAnnouncementError("");
      setAnnouncementSuccess("");

      const response = await fetch(
        `${API_URL}/announcements/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to delete announcement."
        );
      }

      setAnnouncementSuccess(
        "Announcement deleted successfully."
      );

      await loadAnnouncements();
    } catch (error: any) {
      console.error(
        "Announcement deletion error:",
        error
      );

      setAnnouncementError(
        error?.message ||
          "Unable to delete announcement."
      );
    }
  };

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

      if (
        result.success &&
        result.user
      ) {
        setUser(result.user);

        await loadFinancialData();
        await loadAnnouncements();
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
      await loadAnnouncements();
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
  // CHANGE PASSWORD
  // ==========================================

  const handleChangePassword = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    try {
      setChangePasswordLoading(true);

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
      setChangePasswordLoading(false);
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
    setAnnouncements([]);
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
              onClick={async () => {
                await loadFinancialData();
                await loadAnnouncements();
              }}
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

        {/* =====================================================
            ANNOUNCEMENT MANAGEMENT
        ===================================================== */}

        <section className="mt-10">

          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                AbuPay Communication
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Announcement Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Publish important messages that will be visible to AbuPay customers.
              </p>

            </div>

            <button
              type="button"
              onClick={refreshAnnouncements}
              disabled={announcementRefreshing}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {announcementRefreshing
                ? "Refreshing..."
                : "Refresh Announcements"}
            </button>

          </div>

          {announcementSuccess && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

              <p className="text-sm font-semibold text-emerald-700">
                ✓ {announcementSuccess}
              </p>

            </div>
          )}

          {announcementError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">
                {announcementError}
              </p>

            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

            {/* CREATE ANNOUNCEMENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h3 className="text-lg font-bold text-slate-900">
                  Create Announcement
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Publish a new message to customers.
                </p>

              </div>

              <form
                onSubmit={
                  handleCreateAnnouncement
                }
                className="space-y-5"
              >

                {/* TITLE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    value={
                      announcementTitle
                    }
                    onChange={(event) =>
                      setAnnouncementTitle(
                        event.target.value
                      )
                    }
                    maxLength={150}
                    required
                    placeholder="e.g. AbuPay Maintenance Notice"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    {announcementTitle.length}/150
                  </p>

                </div>

                {/* MESSAGE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>

                  <textarea
                    value={
                      announcementMessage
                    }
                    onChange={(event) =>
                      setAnnouncementMessage(
                        event.target.value
                      )
                    }
                    maxLength={1000}
                    required
                    rows={6}
                    placeholder="Enter the announcement customers should see..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    {announcementMessage.length}/1000
                  </p>

                </div>

                {/* TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Announcement Type
                  </label>

                  <select
                    value={
                      announcementType
                    }
                    onChange={(event) =>
                      setAnnouncementType(
                        event.target.value as
                          | "INFO"
                          | "SUCCESS"
                          | "WARNING"
                          | "ERROR"
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >

                    <option value="INFO">
                      INFO
                    </option>

                    <option value="SUCCESS">
                      SUCCESS
                    </option>

                    <option value="WARNING">
                      WARNING
                    </option>

                    <option value="ERROR">
                      ERROR
                    </option>

                  </select>

                </div>

                {/* PREVIEW */}

                <div>

                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Preview
                  </p>

                  <div
                    className={`rounded-xl border p-4 ${
                      announcementType ===
                      "SUCCESS"
                        ? "border-emerald-200 bg-emerald-50"
                        : announcementType ===
                          "WARNING"
                        ? "border-amber-200 bg-amber-50"
                        : announcementType ===
                          "ERROR"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >

                    <p
                      className={`text-sm font-bold ${
                        announcementType ===
                        "SUCCESS"
                          ? "text-emerald-800"
                          : announcementType ===
                            "WARNING"
                          ? "text-amber-800"
                          : announcementType ===
                            "ERROR"
                          ? "text-red-800"
                          : "text-blue-800"
                      }`}
                    >
                      {announcementTitle ||
                        "Announcement title"}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        announcementType ===
                        "SUCCESS"
                          ? "text-emerald-700"
                          : announcementType ===
                            "WARNING"
                          ? "text-amber-700"
                          : announcementType ===
                            "ERROR"
                          ? "text-red-700"
                          : "text-blue-700"
                      }`}
                    >
                      {announcementMessage ||
                        "Your announcement message will appear here."}
                    </p>

                  </div>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    announcementLoading
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-100 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {announcementLoading
                    ? "Publishing..."
                    : "Publish Announcement"}
                </button>

              </form>

            </div>

            {/* EXISTING ANNOUNCEMENTS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-bold text-slate-900">
                    Published Announcements
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Active announcements currently visible to customers.
                  </p>

                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {announcements.length}{" "}
                  {announcements.length === 1
                    ? "Announcement"
                    : "Announcements"}
                </div>

              </div>

              {announcements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">

                    <span className="text-xl">
                      📢
                    </span>

                  </div>

                  <h4 className="font-semibold text-slate-700">
                    No announcements yet
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Create your first announcement using the form.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {announcements.map(
                    (announcement) => (
                      <div
                        key={
                          announcement._id
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0 flex-1">

                            <div className="mb-2 flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  announcement.type ===
                                  "SUCCESS"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : announcement.type ===
                                      "WARNING"
                                    ? "bg-amber-100 text-amber-700"
                                    : announcement.type ===
                                      "ERROR"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {
                                  announcement.type
                                }
                              </span>

                              {announcement.isActive && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  ACTIVE
                                </span>
                              )}

                            </div>

                            <h4 className="text-base font-bold text-slate-900">
                              {
                                announcement.title
                              }
                            </h4>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {
                                announcement.message
                              }
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              Published{" "}
                              {formatDate(
                                announcement.createdAt
                              )}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAnnouncement(
                                announcement._id
                              )
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>

        </section>

      </section>

    </main>
  );
}