"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState } from "react";
import {
  Bell,
  Shield,
  Moon,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    darkMode: false,
    twoFactor: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-gray-500">
            Manage your account preferences and security
          </p>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5">
              <Bell className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>

          <div className="space-y-5">
            {[
              {
                key: "emailNotifications",
                label: "Email Notifications",
                desc: "Receive updates via email",
              },
              {
                key: "pushNotifications",
                label: "Push Notifications",
                desc: "Receive push alerts on your device",
              },
              {
                key: "smsNotifications",
                label: "SMS Notifications",
                desc: "Get important alerts via SMS",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>

                <button
                  onClick={() =>
                    toggleSetting(item.key as keyof typeof settings)
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    settings[item.key as keyof typeof settings]
                      ? "bg-emerald-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                      settings[item.key as keyof typeof settings]
                        ? "translate-x-5"
                        : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Shield className="text-emerald-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Security</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">
                  Add extra security to your account
                </p>
              </div>
              <button
                onClick={() => toggleSetting("twoFactor")}
                className={`relative h-6 w-11 rounded-full transition ${
                  settings.twoFactor ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                    settings.twoFactor ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="border-t pt-5">
              <p className="mb-3 font-medium text-gray-900">Change Password</p>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5">
              <Moon className="text-purple-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-500">
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={() => toggleSetting("darkMode")}
              className={`relative h-6 w-11 rounded-full transition ${
                settings.darkMode ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                  settings.darkMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}