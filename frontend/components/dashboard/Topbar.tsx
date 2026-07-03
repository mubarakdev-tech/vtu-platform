"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      {/* Right Side */}
      <div className="ml-6 flex items-center gap-5">
        <button className="relative">
          <Bell size={22} className="text-gray-600" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>
        </button>

        <div className="flex items-center gap-2">
          <UserCircle2 size={34} className="text-blue-600" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Welcome</p>
            <p className="text-xs text-gray-500">User</p>
          </div>
        </div>
      </div>
    </header>
  );
}