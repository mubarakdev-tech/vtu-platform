"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Megaphone className="text-emerald-600" size={24} />

        <div>
          <h3 className="font-semibold text-emerald-700">
            Announcement
          </h3>

          <p className="text-sm text-gray-600">
            🎉 Welcome to AbuPay. Electricity Bills and Referral Rewards are coming soon.
          </p>
        </div>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="rounded-full p-2 hover:bg-emerald-100"
      >
        <X size={18} />
      </button>
    </div>
  );
}