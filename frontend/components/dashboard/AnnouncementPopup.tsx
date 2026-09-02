"use client";

import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import api from "@/lib/api";
import useAuth from "@/hooks/useAuth";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export default function AnnouncementPopup() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const showPopup = async () => {
      try {
        const { data } = await api.get("/announcements");
        const list = data?.announcements || data?.data || [];

        if (!Array.isArray(list) || list.length === 0) return;

        const latest = list[0];

        const dismissed = JSON.parse(
          localStorage.getItem("dismissed_announcements") || "[]"
        );

        if (dismissed.includes(latest._id)) return;

        setAnnouncement(latest);
        setOpen(true);
      } catch (error) {
        console.error("Failed to load announcement popup:", error);
      }
    };

    const timer = setTimeout(showPopup, 900);
    return () => clearTimeout(timer);
  }, [user]);

  const handleClose = () => {
    if (announcement) {
      const dismissed = JSON.parse(
        localStorage.getItem("dismissed_announcements") || "[]"
      );

      if (!dismissed.includes(announcement._id)) {
        dismissed.push(announcement._id);
        localStorage.setItem(
          "dismissed_announcements",
          JSON.stringify(dismissed)
        );
      }

      // Update the red dot immediately
      window.dispatchEvent(new Event("notifications-updated"));
    }
    setOpen(false);
  };

  if (!open || !announcement) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Megaphone size={20} />
              </div>
              <h3 className="text-lg font-bold">New Announcement</h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 transition hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xl font-bold text-gray-900">
            {announcement.title}
          </h4>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-gray-600">
            {announcement.message}
          </p>

          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}