"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

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

type AnnouncementType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "URGENT";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const formatMoney = (
  amount: number
) =>
  `₦${Number(amount || 0).toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

const formatDate = (
  date?: string | null
) => {
  if (!date) return "No date";

  return new Date(date).toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [financialData, setFinancialData] =
    useState<FinancialData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const [
    showChangePassword,
    setShowChangePassword,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    changePasswordLoading,
    setChangePasswordLoading,
  ] = useState(false);

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  // =====================================================
  // ANNOUNCEMENTS
  // =====================================================

  const [
    announcements,
    setAnnouncements,
  ] = useState<Announcement[]>([]);

  const [
    announcementsLoading,
    setAnnouncementsLoading,
  ] = useState(false);

  const [
    announcementError,
    setAnnouncementError,
  ] = useState("");

  const [
    showAnnouncementForm,
    setShowAnnouncementForm,
  ] = useState(false);

  const [
    editingAnnouncement,
    setEditingAnnouncement,
  ] =
    useState<Announcement | null>(null);

  const [
    announcementTitle,
    setAnnouncementTitle,
  ] = useState("");

  const [
    announcementMessage,
    setAnnouncementMessage,
  ] = useState("");

  const [
    announcementType,
    setAnnouncementType,
  ] =
    useState<AnnouncementType>("INFO");

  const [
    announcementActive,
    setAnnouncementActive,
  ] = useState(true);

  const [
    announcementStartDate,
    setAnnouncementStartDate,
  ] = useState("");

  const [
    announcementEndDate,
    setAnnouncementEndDate,
  ] = useState("");

  const [
    announcementSaving,
    setAnnouncementSaving,
  ] = useState(false);

  // =====================================================
  // CHECK LOGIN
  // =====================================================

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

      const result =
        await response.json();

      if (
        result.success &&
        result.user
      ) {
        setUser(result.user);

        await Promise.all([
          loadFinancialData(),
          loadAnnouncements(),
        ]);
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

  // =====================================================
  // LOGIN
  // =====================================================

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
            "Content-Type":
              "application/json",
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

      await Promise.all([
        loadFinancialData(),
        loadAnnouncements(),
      ]);
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

  // =====================================================
  // FINANCIAL DATA
  // =====================================================

  const loadFinancialData =
    async () => {
      try {
        const response =
          await fetch(
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

  // =====================================================
  // LOAD ANNOUNCEMENTS
  // =====================================================

  const loadAnnouncements =
    async () => {
      try {
        setAnnouncementsLoading(
          true
        );

        setAnnouncementError("");

        const response =
          await fetch(
            `${API_URL}/announcements/admin/all`,
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
              "Unable to load announcements"
          );
        }

        setAnnouncements(
          result.announcements || []
        );
      } catch (error: any) {
        console.error(
          "Announcements error:",
          error
        );

        setAnnouncementError(
          error?.message ||
            "Unable to load announcements"
        );
      } finally {
        setAnnouncementsLoading(
          false
        );
      }
    };

  // =====================================================
  // RESET ANNOUNCEMENT FORM
  // =====================================================

  const resetAnnouncementForm =
    () => {
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementType("INFO");
      setAnnouncementActive(true);
      setAnnouncementStartDate("");
      setAnnouncementEndDate("");
      setEditingAnnouncement(null);
      setShowAnnouncementForm(false);
      setAnnouncementError("");
    };

  // =====================================================
  // CREATE / UPDATE ANNOUNCEMENT
  // =====================================================

  const handleAnnouncementSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (
        !announcementTitle.trim()
      ) {
        setAnnouncementError(
          "Please enter an announcement title."
        );
        return;
      }

      if (
        !announcementMessage.trim()
      ) {
        setAnnouncementError(
          "Please enter an announcement message."
        );
        return;
      }

      if (
        announcementStartDate &&
        announcementEndDate &&
        new Date(
          announcementEndDate
        ) <
          new Date(
            announcementStartDate
          )
      ) {
        setAnnouncementError(
          "End date cannot be earlier than start date."
        );
        return;
      }

      try {
        setAnnouncementSaving(
          true
        );

        setAnnouncementError("");

        const isEditing =
          !!editingAnnouncement;

        const url = isEditing
          ? `${API_URL}/announcements/${editingAnnouncement?._id}`
          : `${API_URL}/announcements`;

        const method = isEditing
          ? "PUT"
          : "POST";

        const response =
          await fetch(url, {
            method,

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title:
                announcementTitle.trim(),

              message:
                announcementMessage.trim(),

              type:
                announcementType,

              isActive:
                announcementActive,

              startDate:
                announcementStartDate ||
                null,

              endDate:
                announcementEndDate ||
                null,
            }),
          });

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to save announcement."
          );
        }

        resetAnnouncementForm();

        await loadAnnouncements();
      } catch (error: any) {
        console.error(
          "Save announcement error:",
          error
        );

        setAnnouncementError(
          error?.message ||
            "Unable to save announcement."
        );
      } finally {
        setAnnouncementSaving(
          false
        );
      }
    };

  // =====================================================
  // EDIT ANNOUNCEMENT
  // =====================================================

  const handleEditAnnouncement =
    (
      announcement: Announcement
    ) => {
      setEditingAnnouncement(
        announcement
      );

      setAnnouncementTitle(
        announcement.title
      );

      setAnnouncementMessage(
        announcement.message
      );

      setAnnouncementType(
        announcement.type
      );

      setAnnouncementActive(
        announcement.isActive
      );

      setAnnouncementStartDate(
        announcement.startDate
          ? announcement.startDate
              .slice(0, 10)
          : ""
      );

      setAnnouncementEndDate(
        announcement.endDate
          ? announcement.endDate
              .slice(0, 10)
          : ""
      );

      setShowAnnouncementForm(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =====================================================
  // TOGGLE ANNOUNCEMENT
  // =====================================================

  const handleToggleAnnouncement =
    async (
      announcement: Announcement
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/announcements/${announcement._id}/status`,
            {
              method: "PATCH",

              credentials: "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                isActive:
                  !announcement.isActive,
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
              "Unable to update announcement."
          );
        }

        await loadAnnouncements();
      } catch (error: any) {
        console.error(
          "Toggle announcement error:",
          error
        );

        setAnnouncementError(
          error?.message ||
            "Unable to update announcement."
        );
      }
    };

  // =====================================================
  // DELETE ANNOUNCEMENT
  // =====================================================

  const handleDeleteAnnouncement =
    async (
      announcement: Announcement
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${announcement.title}"?\n\nThis action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/announcements/${announcement._id}`,
            {
              method: "DELETE",

              credentials: "include",
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
              "Unable to delete announcement."
          );
        }

        await loadAnnouncements();
      } catch (error: any) {
        console.error(
          "Delete announcement error:",
          error
        );

        setAnnouncementError(
          error?.message ||
            "Unable to delete announcement."
        );
      }
    };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword =
    async (
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
        newPassword !==
        confirmPassword
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

        const response =
          await fetch(
            `${API_URL}/auth/change-password`,
            {
              method: "POST",

              credentials: "include",

              headers: {
                "Content-Type":
                  "application/json",
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

  // =====================================================
  // LOGOUT
  // =====================================================

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

  // =====================================================
  // INITIAL CHECK
  // =====================================================

  useEffect(() => {
    checkLogin();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // LOGIN
  // =====================================================

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
                disabled={loginLoading}
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

  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">

      {/* =================================================
          HEADER
      ================================================= */}

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
              onClick={() => {
                loadFinancialData();
                loadAnnouncements();
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

      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}

      {showChangePassword && (
        <section className="border-b border-slate-200 bg-white">

          <div className="mx-auto max-w-7xl px-6 py-8">

            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="mb-6">

                <h2 className="text-xl font-bold">
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
                  <label className="mb-2 block text-sm font-semibold">
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3">

                  <button
                    type="submit"
                    disabled={
                      changePasswordLoading
                    }
                    className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {changePasswordLoading
                      ? "Changing..."
                      : "Change Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowChangePassword(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold"
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          </div>

        </section>
      )}

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            ANNOUNCEMENTS
        ================================================= */}

        <div className="mb-12">

          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                Communications
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Announcements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage messages displayed to AbuPay customers.
              </p>

            </div>

            <button
              onClick={() => {
                if (
                  showAnnouncementForm
                ) {
                  resetAnnouncementForm();
                } else {
                  setShowAnnouncementForm(
                    true
                  );
                }
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              {showAnnouncementForm
                ? "Cancel"
                : "+ New Announcement"}
            </button>

          </div>

          {/* =================================================
              ANNOUNCEMENT FORM
          ================================================= */}

          {showAnnouncementForm && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h3 className="text-xl font-bold">
                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  This announcement can be displayed to AbuPay customers.
                </p>

              </div>

              {announcementError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-700">
                    {announcementError}
                  </p>

                </div>
              )}

              <form
                onSubmit={
                  handleAnnouncementSubmit
                }
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Title
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
                    placeholder="e.g. Welcome to AbuPay"
                    maxLength={150}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
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
                    placeholder="Enter the announcement message..."
                    maxLength={2000}
                    rows={5}
                    required
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    {
                      announcementMessage.length
                    }{" "}
                    / 2000 characters
                  </p>

                </div>

                <div className="grid gap-5 md:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Announcement Type
                    </label>

                    <select
                      value={
                        announcementType
                      }
                      onChange={(event) =>
                        setAnnouncementType(
                          event.target
                            .value as AnnouncementType
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="INFO">
                        Info
                      </option>

                      <option value="SUCCESS">
                        Success
                      </option>

                      <option value="WARNING">
                        Warning
                      </option>

                      <option value="URGENT">
                        Urgent
                      </option>
                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={
                        announcementStartDate
                      }
                      onChange={(event) =>
                        setAnnouncementStartDate(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={
                        announcementEndDate
                      }
                      onChange={(event) =>
                        setAnnouncementEndDate(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />

                  </div>

                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <input
                    type="checkbox"
                    checked={
                      announcementActive
                    }
                    onChange={(event) =>
                      setAnnouncementActive(
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 rounded border-slate-300 text-blue-600"
                  />

                  <div>

                    <p className="font-semibold">
                      Publish announcement
                    </p>

                    <p className="text-sm text-slate-500">
                      Active announcements can be displayed to customers.
                    </p>

                  </div>

                </label>

                <div className="flex gap-3 pt-2">

                  <button
                    type="submit"
                    disabled={
                      announcementSaving
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {announcementSaving
                      ? "Saving..."
                      : editingAnnouncement
                      ? "Update Announcement"
                      : "Publish Announcement"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      resetAnnouncementForm
                    }
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* =================================================
              ANNOUNCEMENT LIST
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-bold">
                    All Announcements
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      announcements.length
                    }{" "}
                    announcement
                    {announcements.length ===
                    1
                      ? ""
                      : "s"}
                  </p>

                </div>

                <button
                  onClick={
                    loadAnnouncements
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Refresh
                </button>

              </div>

            </div>

            {announcementError && (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4">

                <p className="text-sm font-semibold text-red-700">
                  {announcementError}
                </p>

              </div>
            )}

            {announcementsLoading ? (
              <div className="p-10 text-center">

                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="text-sm text-slate-500">
                  Loading announcements...
                </p>

              </div>
            ) : announcements.length ===
              0 ? (
              <div className="p-12 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">

                  <span className="text-2xl">
                    📢
                  </span>

                </div>

                <h4 className="font-semibold">
                  No announcements yet
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first AbuPay announcement.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-200">

                {announcements.map(
                  (
                    announcement
                  ) => (
                    <div
                      key={
                        announcement._id
                      }
                      className="p-6"
                    >

                      <div className="flex flex-col justify-between gap-5 lg:flex-row">

                        <div className="min-w-0 flex-1">

                          <div className="mb-2 flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                announcement.type ===
                                "INFO"
                                  ? "bg-blue-100 text-blue-700"
                                  : announcement.type ===
                                    "SUCCESS"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : announcement.type ===
                                    "WARNING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {
                                announcement.type
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                announcement.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {announcement.isActive
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>

                          </div>

                          <h4 className="text-lg font-bold">
                            {
                              announcement.title
                            }
                          </h4>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {
                              announcement.message
                            }
                          </p>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                            <span>
                              Created:{" "}
                              {formatDate(
                                announcement.createdAt
                              )}
                            </span>

                            {announcement.startDate && (
                              <span>
                                Starts:{" "}
                                {formatDate(
                                  announcement.startDate
                                )}
                              </span>
                            )}

                            {announcement.endDate && (
                              <span>
                                Ends:{" "}
                                {formatDate(
                                  announcement.endDate
                                )}
                              </span>
                            )}

                          </div>

                        </div>

                        <div className="flex flex-wrap items-start gap-2">

                          <button
                            onClick={() =>
                              handleEditAnnouncement(
                                announcement
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleToggleAnnouncement(
                                announcement
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                              announcement.isActive
                                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {announcement.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteAnnouncement(
                                announcement
                              )
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        {/* =================================================
            FINANCIAL DASHBOARD
        ================================================= */}

        <div>

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

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <p className="text-sm font-medium text-slate-500">
                    Recorded Revenue
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {formatMoney(
                      financialData.revenue
                        .total
                    )}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {
                      financialData.revenue
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
                      financialData.expenses
                        .total
                    )}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {
                      financialData.expenses
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
                      financialData.grossProfit
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
                        financialData.airtime
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
                        financialData.data
                          .revenue
                      )}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        financialData.data
                          .transactions
                      }{" "}
                      transactions
                    </p>

                  </div>

                </div>

              </div>

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

        </div>

      </section>

    </main>
  );
}