"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  KeyRound,
  Wallet,
} from "lucide-react";

const services = [
  {
    name: "Airtime",
    icon: Smartphone,
    active: true,
  },
  {
    name: "Data",
    icon: Wifi,
    active: true,
  },
  {
    name: "Electricity",
    icon: Zap,
    active: false,
  },
  {
    name: "Cable TV",
    icon: Tv,
    active: false,
  },
  {
    name: "Exam PIN",
    icon: KeyRound,
    active: false,
  },
  {
    name: "Wallet",
    icon: Wallet,
    active: true,
  },
];

export default function ServicesGrid() {
  return (
    <Card>
      <CardContent className="p-6">

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Services
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Access your AbuPay services from one place
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">

          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.name}
                className={`rounded-xl border p-6 text-center select-none ${
                  service.active
                    ? "border-gray-200 bg-white"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Icon */}

                <div
                  className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                    service.active
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon size={24} />
                </div>

                {/* Service Name */}

                <p
                  className={`font-medium ${
                    service.active
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {service.name}
                </p>

                {/* Status */}

                <p
                  className={`mt-2 text-xs ${
                    service.active
                      ? "text-gray-400"
                      : "text-gray-400"
                  }`}
                >
                  {service.active
                    ? "Available"
                    : "Coming Soon"}
                </p>
              </div>
            );
          })}

        </div>

      </CardContent>
    </Card>
  );
}