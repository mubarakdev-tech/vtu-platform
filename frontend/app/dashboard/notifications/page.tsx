"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react";
import { useState } from "react";

const sampleNotifications = [
  {
    id: 1,
    type: "success",
    title: "Wallet Funded Successfully",
    message: "Your wallet has been credited with ₦5,000.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "New Feature Available",
    message: "You can now buy data and airtime faster on AbuPay.",
    time: "1 day ago",
    read: true,
  },
  {
    id: 3,
    type: "warning",
    title: "Transaction Pending",
    message: "Your airtime purchase of ₦1,000 is being processed.",
    time: "2 days ago",
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(sampleNotifications);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-emerald-600" size={20} />;
      case "warning":
        return <AlertCircle className="text-amber-500" size={20} />;
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-gray-500">
              Stay updated with your account activities
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border bg-white py-16 text-center shadow-sm">
              <Bell className="mx-auto text-gray-300" size={48} />
              <p className="mt-4 text-lg font-medium text-gray-500">
                No notifications yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                We’ll notify you when something important happens
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition ${
                  !item.read ? "border-l-4 border-l-emerald-500" : ""
                }`}
              >
                <div className="mt-1 rounded-full bg-gray-50 p-2">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">{item.time}</p>
                    </div>

                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}