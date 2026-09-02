"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "URGENT";
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/announcements");

      let list = data?.announcements || data?.data || [];

      const dismissed = JSON.parse(
        localStorage.getItem("dismissed_announcements") || "[]"
      );

      list = list.filter(
        (item: Announcement) => !dismissed.includes(item._id)
      );

      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));

    const dismissed = JSON.parse(
      localStorage.getItem("dismissed_announcements") || "[]"
    );

    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(
        "dismissed_announcements",
        JSON.stringify(dismissed)
      );
    }

    // Update Header red dot immediately
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="text-emerald-600" size={20} />;
      case "WARNING":
      case "URGENT":
        return <AlertCircle className="text-amber-500" size={20} />;
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-500">
            Stay updated with important announcements
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
          ) : notifications.length === 0 ? (
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
                key={item._id}
                className="flex items-start gap-4 rounded-2xl border border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm"
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
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {formatTime(item.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteNotification(item._id)}
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