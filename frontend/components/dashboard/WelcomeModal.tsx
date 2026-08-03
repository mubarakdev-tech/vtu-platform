"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Bell, CheckCircle } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  userName?: string;
  onClose: () => void;
}

export default function WelcomeModal({
  open,
  userName = "User",
  onClose,
}: WelcomeModalProps) {
  const handleContinue = () => {
    localStorage.setItem("abupay-welcome-seen", "true");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 z-[101] w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 p-8 text-white">

              <h2 className="text-3xl font-bold">
                🎉 Welcome to AbuPay
              </h2>

              <p className="mt-3 text-lg text-blue-100">
                Welcome back,
                <span className="font-bold text-white">
                  {" "}
                  {userName}
                </span>
              </p>

            </div>

            {/* Body */}
            <div className="space-y-8 p-8">

              {/* Information */}

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <Bell className="text-blue-600" />

                  <h3 className="text-xl font-bold">
                    Information
                  </h3>

                </div>

                <ul className="space-y-3 text-gray-600">

                  <li className="flex gap-3">
                    <CheckCircle className="mt-1 text-green-600" size={18} />
                    Airtime and Data purchases are available.
                  </li>

                  <li className="flex gap-3">
                    <CheckCircle className="mt-1 text-green-600" size={18} />
                    Wallet funding, Electricity and TV subscriptions are being rolled out.
                  </li>

                  <li className="flex gap-3">
                    <CheckCircle className="mt-1 text-green-600" size={18} />
                    More premium features will be added regularly.
                  </li>

                </ul>

              </div>

              {/* Security */}

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <ShieldCheck className="text-emerald-600" />

                  <h3 className="text-xl font-bold">
                    Security Reminder
                  </h3>

                </div>

                <ul className="space-y-3 text-gray-600">

                  <li>🔒 Never share your password.</li>

                  <li>🔒 Never share your OTP.</li>

                  <li>🔒 AbuPay will NEVER ask for your PIN.</li>

                  <li>📧 Official Support: assistance.abupayng@outlook.com</li>

                </ul>

              </div>

              {/* Button */}

              <button
                onClick={handleContinue}
                className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition hover:bg-emerald-700"
              >
                Continue to Dashboard
              </button>

            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}