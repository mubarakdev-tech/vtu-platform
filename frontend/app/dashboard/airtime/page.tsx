"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Smartphone, Loader2 } from "lucide-react";
import { buyAirtime } from "@/services/airtime";
import useAuth from "@/hooks/useAuth";

const networks = [
  { id: "mtn", name: "MTN", color: "bg-yellow-400", text: "text-black" },
  { id: "airtel", name: "Airtel", color: "bg-red-500", text: "text-white" },
  { id: "glo", name: "Glo", color: "bg-green-600", text: "text-white" },
  { id: "9mobile", name: "9mobile", color: "bg-emerald-700", text: "text-white" },
];

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimePage() {
  const { user } = useAuth();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePurchase = async () => {
    if (!phone || phone.length < 11) {
      setMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    if (!amount || Number(amount) < 50) {
      setMessage({ type: "error", text: "Minimum amount is ₦50" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const result = await buyAirtime({
        network,
        phone,
        amount: Number(amount),
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: `Airtime of ₦${Number(amount).toLocaleString()} sent successfully to ${phone}`,
        });
        setPhone("");
        setAmount("");
      } else {
        setMessage({
          type: "error",
          text: result.message || "Purchase failed. Please try again.",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buy Airtime</h1>
          <p className="mt-1 text-gray-500">
            Instant airtime top-up for all networks
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          {/* Network Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select Network
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setNetwork(net.id)}
                  className={`rounded-xl py-4 text-sm font-semibold transition ${
                    network === net.id
                      ? `${net.color} ${net.text} ring-2 ring-offset-2 ring-emerald-500`
                      : "border bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {net.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              maxLength={11}
              className="w-full rounded-xl border px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Quick Amounts */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Quick Amount
            </label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className={`rounded-xl border py-3 text-sm font-medium transition ${
                    amount === String(value)
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  ₦{value}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Or Enter Amount
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border py-3.5 pr-4 pl-9 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Buy Button */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <Smartphone size={18} />
                Buy Airtime
              </>
            )}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}