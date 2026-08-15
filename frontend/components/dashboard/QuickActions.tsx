"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
} from "lucide-react";

const actions = [
  {
    title: "Airtime",
    icon: Smartphone,
    href: "/dashboard/airtime",
    color: "hover:bg-yellow-400 hover:text-black",
    disabled: false,
  },
  {
    title: "Data",
    icon: Wifi,
    href: "/dashboard/data",
    color: "hover:bg-blue-600 hover:text-white",
    disabled: false,
  },
  {
    title: "Electricity",
    icon: Zap,
    color: "",
    disabled: true,
  },
  {
    title: "Cable TV",
    icon: Tv,
    color: "",
    disabled: true,
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;

            // Disabled services: display only, no link/click
            if (action.disabled) {
              return (
                <div
                  key={action.title}
                  className="flex cursor-not-allowed flex-col items-center justify-center rounded-xl border bg-gray-50 p-6 text-center text-gray-400"
                >
                  <Icon className="mb-3" size={32} />
                  <p className="font-medium">{action.title}</p>
                  <span className="mt-1 text-xs">
                    Coming Soon
                  </span>
                </div>
              );
            }

            // Active services
            return (
              <Link
                key={action.title}
                href={action.href!}
                className={`flex flex-col items-center justify-center rounded-xl border bg-white p-6 text-center transition ${action.color} hover:shadow-md`}
              >
                <Icon className="mb-3" size={32} />
                <p className="font-medium">{action.title}</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}