"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Wallet, Menu } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useWallet from "@/hooks/useWallet";
import Link from "next/link";
import api from "@/lib/api";

const services = [
  { name: "Buy Airtime", href: "/dashboard/airtime", keywords: ["airtime", "mtn", "glo", "airtel", "9mobile"] },
  { name: "Buy Data", href: "/dashboard/data", keywords: ["data", "internet", "bundle"] },
  { name: "Wallet", href: "/dashboard/wallet", keywords: ["wallet", "fund", "balance", "paystack"] },
  { name: "Transactions", href: "/dashboard/transactions", keywords: ["transactions", "history", "receipt"] },
  { name: "Referral", href: "/dashboard/referral", keywords: ["referral", "invite", "bonus"] },
  { name: "Notifications", href: "/dashboard/notifications", keywords: ["notification", "alert"] },
  { name: "Profile", href: "/dashboard/profile", keywords: ["profile", "account"] },
  { name: "Settings", href: "/dashboard/settings", keywords: ["settings", "password", "security"] },
  { name: "Help Center", href: "/dashboard/help", keywords: ["help", "support", "contact"] },
];

export default function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, loading } = useWallet();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

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

  // ==========================================
  // CHECK FOR UNREAD ANNOUNCEMENTS
  // ==========================================
  useEffect(() => {
    const checkUnread = async () => {
      try {
        const { data } = await api.get("/announcements");
        const list = data?.announcements || data?.data || [];

        if (!Array.isArray(list) || list.length === 0) {
          setHasUnread(false);
          return;
        }

        const dismissed = JSON.parse(
          localStorage.getItem("dismissed_announcements") || "[]"
        );

        const unreadCount = list.filter(
          (item: any) => !dismissed.includes(item._id)
        ).length;

        setHasUnread(unreadCount > 0);
      } catch (error) {
        console.error("Failed to check notifications:", error);
        setHasUnread(false);
      }
    };

    if (user) {
      checkUnread();
    }

    // Listen for when notifications are deleted
    const handleUpdate = () => {
      checkUnread();
    };

    window.addEventListener("notifications-updated", handleUpdate);

    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return services.filter((item) => {
      const inName = item.name.toLowerCase().includes(q);
      const inKeywords = item.keywords.some((k) => k.includes(q));
      return inName || inKeywords;
    });
  }, [query]);

  const goTo = (href: string) => {
    setQuery("");
    setOpen(false);
    router.push(href);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      goTo(results[0].href);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4 md:h-20 md:px-6">
        {/* Left */}
        <div className="relative flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Search */}
          <form
            onSubmit={onSubmit}
            className="relative w-full max-w-md md:max-w-lg lg:max-w-xl"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:left-4"
              size={18}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                setTimeout(() => setOpen(false), 150);
              }}
              placeholder="Search services..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:py-2.5 sm:pl-11 sm:pr-4"
            />

            {open && query.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-white shadow-lg">
                {results.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No service found
                  </p>
                ) : (
                  results.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goTo(item.href)}
                      className="block w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {item.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </form>
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
            {hasUnread && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
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