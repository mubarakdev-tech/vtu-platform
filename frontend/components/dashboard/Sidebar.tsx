"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Smartphone,
  Wifi,
  History,
  User,
  Settings,
  Gift,
  Bell,
  LogOut,
  HelpCircle,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { title: "Airtime", href: "/dashboard/airtime", icon: Smartphone },
  { title: "Data", href: "/dashboard/data", icon: Wifi },
  { title: "Transactions", href: "/dashboard/transactions", icon: History },
  { title: "Referral", href: "/dashboard/referral", icon: Gift },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-screen w-72 flex-col bg-gradient-to-b from-emerald-700 via-emerald-600 to-teal-700 text-white shadow-xl">
      {/* Logo */}
      <div className="border-b border-white/20 p-6">
        <h1 className="text-3xl font-extrabold">AbuPay</h1>

        <p className="mt-1 text-sm text-emerald-100">
          Fast • Secure • Reliable
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 ${
                active
                  ? "bg-white text-emerald-700 shadow-lg"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon
                size={20}
                className="transition group-hover:scale-110"
              />

              <span className="font-medium">
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/20 p-5">

        {/* Help Center */}
        <Link
          href="/dashboard/help"
          className={`mb-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
            pathname === "/dashboard/help"
              ? "bg-white text-emerald-700 shadow-lg"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <HelpCircle size={20} />
          <span>Help Center</span>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-red-500/20 px-4 py-3 transition hover:bg-red-500/30"
        >
          <LogOut size={20} />
          Logout
        </button>

        <p className="mt-6 text-center text-xs text-emerald-100">
          AbuPay v1.0.0
        </p>

      </div>
    </aside>
  );
}