"use client";

import { Bell, Search, Wallet, UserCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6">

        {/* Search */}

        <div className="relative hidden w-96 md:block">

          <Search
            className="absolute left-4 top-3.5 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search services..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 outline-none focus:border-emerald-500"
          />

        </div>

        {/* Right Side */}

        <div className="flex items-center gap-5">

          {/* Wallet */}

          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2">

            <Wallet
              className="text-emerald-600"
              size={20}
            />

            <div>

              <p className="text-xs text-gray-500">
                Wallet
              </p>

              <p className="font-semibold">
                ₦0.00
              </p>

            </div>

          </div>

          {/* Notification */}

          <button className="relative rounded-full p-3 hover:bg-gray-100">

            <Bell size={22} />

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>

          </button>

          {/* Profile */}

          <button className="flex items-center gap-3 rounded-xl border px-3 py-2 hover:bg-gray-50">

            <UserCircle
              className="text-emerald-600"
              size={38}
            />

            <div className="hidden md:block text-left">

              <p className="font-semibold">
                Welcome
              </p>

              <p className="text-xs text-gray-500">
                AbuPay User
              </p>

            </div>

          </button>

        </div>

      </div>
    </header>
  );
}