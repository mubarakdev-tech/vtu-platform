"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  Wifi,
  Wallet,
  History,
  User,
  Settings,
  Bell,
  Gift,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Buy Airtime", href: "/dashboard/airtime", icon: Smartphone },
  { name: "Buy Data", href: "/dashboard/data", icon: Wifi },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Transactions", href: "/dashboard/transactions", icon: History },
  { name: "Referral", href: "/dashboard/referral", icon: Gift },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help Center", href: "/dashboard/help", icon: HelpCircle },
];

export default function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-full min-h-screen w-full flex-col bg-emerald-800 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-emerald-700 px-5 py-5 sm:px-6 sm:py-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          AbuPay
        </Link>

        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-1.5 hover:bg-emerald-700 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <p className="px-5 pt-2 text-xs text-emerald-200 sm:px-6">
        VTU Platform
      </p>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-emerald-800"
                  : "text-emerald-100 hover:bg-emerald-700"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout + Branding */}
      <div className="border-t border-emerald-700 p-4">
        <button
          onClick={() => {
            onNavigate?.();
            logout?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-700"
        >
          <LogOut size={18} />
          Logout
        </button>

        <p className="mt-4 text-center text-xs text-emerald-200">
          Powered by Abu Niematullah Ventures
        </p>
      </div>
    </aside>
  );
}