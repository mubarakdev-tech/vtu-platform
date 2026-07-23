"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Wallet,
  Smartphone,
  Wifi,
  History,
  User,
  Settings,
} from "lucide-react";


const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    title: "Airtime",
    href: "/dashboard/airtime",
    icon: Smartphone,
  },
  {
    title: "Data",
    href: "/dashboard/data",
    icon: Wifi,
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: History,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];


export default function Sidebar() {

  const pathname = usePathname();


  return (

    <aside className="w-64 min-h-screen bg-blue-700 text-white">

      <div className="border-b border-blue-600 p-6">

        <h1 className="text-2xl font-bold">
          VTU Platform
        </h1>

      </div>


      <nav className="p-4 space-y-2">

        {menuItems.map((item) => {

          const Icon = item.icon;


          return (

            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-white text-blue-700"
                  : "hover:bg-blue-600"
              }`}
            >

              <Icon size={20} />

              <span>
                {item.title}
              </span>

            </Link>

          );

        })}

      </nav>

    </aside>

  );

}