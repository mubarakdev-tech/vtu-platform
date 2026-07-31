import { Gift, Share2 } from "lucide-react";

export default function ReferralSummary() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm text-gray-500">
            Referral Earnings
          </p>

          <h2 className="text-3xl font-bold text-emerald-600">
            ₦0
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Invite friends and earn rewards.
          </p>

        </div>

        <Gift size={50} className="text-emerald-500" />

      </div>

      <button className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700">
        <Share2 size={18} />
        Share Referral Link
      </button>
    </div>
  );
}