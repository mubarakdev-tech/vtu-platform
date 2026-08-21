"use client";

import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Zap,
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "URGENT";
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

interface WelcomeModalProps {
  open: boolean;
  userName: string;
  announcement?: Announcement | null;
  onClose: () => void;
}

export default function WelcomeModal({
  open,
  userName,
  announcement,
  onClose,
}: WelcomeModalProps) {
  if (!open || !announcement) {
    return null;
  }

  // =====================================================
  // TYPE STYLING
  // =====================================================

  const getTypeConfig = () => {
    switch (announcement.type) {
      case "SUCCESS":
        return {
          icon: CheckCircle,
          label: "Success",
          iconClass:
            "bg-emerald-100 text-emerald-600",
          badgeClass:
            "bg-emerald-100 text-emerald-700",
        };

      case "WARNING":
        return {
          icon: AlertCircle,
          label: "Important",
          iconClass:
            "bg-amber-100 text-amber-600",
          badgeClass:
            "bg-amber-100 text-amber-700",
        };

      case "URGENT":
        return {
          icon: Zap,
          label: "Urgent",
          iconClass:
            "bg-red-100 text-red-600",
          badgeClass:
            "bg-red-100 text-red-700",
        };

      case "INFO":
      default:
        return {
          icon: Info,
          label: "Information",
          iconClass:
            "bg-blue-100 text-blue-600",
          badgeClass:
            "bg-blue-100 text-blue-700",
        };
    }
  };

  const config =
    getTypeConfig();

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* =================================================
            TOP GRADIENT
        ================================================= */}

        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* =================================================
            CLOSE BUTTON
        ================================================= */}

        <button
          onClick={onClose}
          aria-label="Close announcement"
          className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X size={18} />
        </button>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="p-7">

          {/* ICON */}

          <div className="mb-5 flex items-center justify-between">

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconClass}`}
            >
              <Icon size={28} />
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${config.badgeClass}`}
            >
              {config.label}
            </span>

          </div>

          {/* GREETING */}

          <p className="text-sm font-medium text-blue-600">
            Hello {userName} 👋
          </p>

          {/* TITLE */}

          <h2 className="mt-2 pr-8 text-2xl font-bold text-slate-900">
            {announcement.title}
          </h2>

          {/* MESSAGE */}

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {announcement.message}
          </p>

          {/* BRAND */}

          <div className="mt-7 rounded-2xl bg-slate-50 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="font-black text-white">
                  A
                </span>
              </div>

              <div>

                <p className="text-sm font-bold text-slate-900">
                  AbuPay
                </p>

                <p className="text-xs text-slate-500">
                  Fast • Reliable • Secure
                </p>

              </div>

            </div>

          </div>

          {/* BUTTON */}

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700"
          >
            Continue to AbuPay
          </button>

        </div>

      </div>

    </div>
  );
}