"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Gift, Copy, Users, Wallet } from "lucide-react";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Temporary referral code (we will make it real later)
  const referralCode = user?.id?.slice(-8).toUpperCase() || "ABUPAY123";
  const referralLink = `https://abupay.com/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="mt-2 text-gray-500">
            Invite friends and earn rewards when they fund their wallet.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3">
                <Users className="text-emerald-600" size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <Wallet className="text-blue-600" size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Earnings</p>
                <p className="text-2xl font-bold">₦0</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3">
                <Gift className="text-purple-600" size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">₦0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Your Referral Link</h2>
          <p className="mt-2 text-gray-500">
            Share this link with friends. You earn when they fund their wallet.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 rounded-xl border bg-gray-50 px-4 py-3 text-sm"
            />
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              <Copy size={18} />
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              <strong>How it works:</strong> Share your link → Friend registers → 
              Friend funds wallet → You earn commission.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}