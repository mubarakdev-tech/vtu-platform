"use client";

import { Bell, Search, Wallet, Menu } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useWallet from "@/hooks/useWallet";
import Link from "next/link";

export default function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { user } = useAuth();
  const { balance, loading } = useWallet();

  const displayName =
    (user as any)?.firstName ||
    (user as any)?.name ||
    "User";

  const initial = String(displayName).charAt(0).toUpperCase() || "U";

  const avatarUrl =
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    (user as any)?.image ||
    null;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4 md:h-20 md:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="relative hidden w-56 md:block lg:w-80 xl:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:left-4"
              size={18}
            />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:py-2.5 sm:pl-11 sm:pr-4"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5">
          {/* Wallet */}
          <Link
            href="/dashboard/wallet"
            className="flex items-center gap-2 rounded-xl bg-emerald-50 px-2.5 py-1.5 transition hover:bg-emerald-100 sm:px-3 sm:py-2 md:px-4"
          >
            <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
              <Wallet size={14} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-gray-500 sm:text-[11px]">
                Wallet
              </p>
              <p className="text-xs font-bold text-emerald-700 sm:text-sm">
                {loading
                  ? "••••"
                  : `₦${Number(balance || 0).toLocaleString()}`}
              </p>
            </div>
          </Link>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className="relative rounded-full p-2 transition hover:bg-gray-100 sm:p-2.5"
          >
            <Bell size={18} className="text-gray-600" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </Link>

          {/* Profile */}
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-1.5 py-1 transition hover:bg-gray-50 sm:px-2.5 sm:py-1.5 md:px-3"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 sm:h-9 sm:w-9 sm:text-sm">
                {initial}
              </div>
            )}

            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-gray-900">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">AbuPay Account</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}