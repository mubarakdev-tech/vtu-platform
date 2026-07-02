"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-4">

      <div className="relative w-80">

        <Search
          className="absolute left-3 top-3 text-gray-400"
          size={18}
        />

        <Input
          placeholder="Search..."
          className="pl-10"
        />

      </div>

      <div className="flex items-center gap-6">

        <Bell
          className="cursor-pointer"
          size={22}
        />

        <Avatar>
          <AvatarFallback>MM</AvatarFallback>
        </Avatar>

      </div>
    </header>
  );
}