"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Wallet,
  UserCircle,
  HelpCircle,
} from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { getWallet } from "@/services/wallet.service";

export default function Header() {
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);

  // ==========================================
  // GET REAL WALLET BALANCE
  // ==========================================

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const res = await getWallet();

        const walletBalance = Number(
          res?.data?.balance ??
            res?.balance ??
            0
        );

        setBalance(walletBalance);
      } catch (error) {
        console.error(
          "Failed to load wallet balance:",
          error
        );
      }
    };

    fetchWalletBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(
      fetchWalletBalance,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // REAL USER NAME
  // ==========================================

  const userName =
    (user as any)?.name ||
    (user as any)?.fullName ||
    (user as any)?.username ||
    "AbuPay User";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 md:px-6">

        {/* ====================================
            SEARCH
        ==================================== */}

        <div className="relative hidden w-96 md:block">

          <Search
            className="absolute left-4 top-3.5 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search services..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

        </div>

        {/* ====================================
            RIGHT SIDE
        ==================================== */}

        <div className="ml-auto flex items-center gap-3 md:gap-5">

          {/* ==================================
              WALLET
          ================================== */}

          <Link
            href="/dashboard/wallet"
            className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 transition hover:bg-emerald-100 lg:flex"
          >

            <Wallet
              className="text-emerald-600"
              size={20}
            />

            <div>

              <p className="text-xs text-gray-500">
                Wallet
              </p>

              <p className="font-semibold text-gray-900">
                ₦
                {balance.toLocaleString(
                  "en-NG",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

            </div>

          </Link>

          {/* ==================================
              NOTIFICATION
          ================================== */}

          <button
            type="button"
            onClick={() => {
              // Notifications page can be connected
              // when the notification route is ready.
            }}
            aria-label="Notifications"
            className="relative rounded-full p-3 transition hover:bg-gray-100"
          >

            <Bell
              size={22}
              className="text-gray-700"
            />

            {/* Notification indicator */}

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />

          </button>

          {/* ==================================
              PROFILE
          ================================== */}

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
          >

            <UserCircle
              className="text-emerald-600"
              size={38}
            />

            <div className="hidden text-left md:block">

              <p className="font-semibold text-gray-900">
                Welcome
              </p>

              <p className="max-w-[140px] truncate text-xs text-gray-500">
                {userName}
              </p>

            </div>

          </Link>

          {/* ==================================
              HELP CENTER
          ================================== */}

          <Link
            href="/dashboard/help"
            aria-label="Help Center"
            className="hidden rounded-full p-3 text-gray-600 transition hover:bg-gray-100 md:block"
          >

            <HelpCircle size={22} />

          </Link>

        </div>

      </div>
    </header>
  );
}