"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Eye,
  EyeOff,
  Plus,
  Loader2,
} from "lucide-react";
import useWallet from "@/hooks/useWallet";
import { fundWallet } from "@/services/wallet.service";
import CountUp from "react-countup";

const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

export default function WalletPage() {
  const { balance, loading, refreshWallet } = useWallet();
  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFund = async () => {
    const value = Number(amount);

    if (!value || value < 100) {
      setMessage({
        type: "error",
        text: "Minimum funding amount is ₦100",
      });
      return;
    }

    try {
      setFunding(true);
      setMessage(null);

      const data = await fundWallet(value);

      if (data.success) {
        setMessage({
          type: "success",
          text: `Wallet funded successfully with ₦${value.toLocaleString()}`,
        });
        setAmount("");
        refreshWallet();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Funding failed. Please try again.",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setFunding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="mt-1 text-gray-500">
            Fund your wallet and manage your balance
          </p>
        </div>

        {/* Balance Card */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-100">
                <Wallet size={20} />
                <span className="text-sm font-medium">Available Balance</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <h2 className="text-5xl font-bold tracking-tight">
                  {loading ? (
                    "••••••"
                  ) : showBalance ? (
                    <>
                      ₦
                      <CountUp
                        end={balance}
                        duration={1.2}
                        separator=","
                        decimals={2}
                      />
                    </>
                  ) : (
                    "₦ ••••••"
                  )}
                </h2>

                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="rounded-full bg-white/15 p-2 transition hover:bg-white/25"
                >
                  {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Wallet size={80} className="hidden opacity-20 md:block" />
          </div>

          {/* Quick Actions */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 rounded-2xl bg-white/15 py-4 transition hover:bg-white/25">
              <ArrowDownCircle size={22} />
              <span className="text-sm font-medium">Fund</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-2xl bg-white/15 py-4 transition hover:bg-white/25">
              <ArrowUpCircle size={22} />
              <span className="text-sm font-medium">Transfer</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-2xl bg-white/15 py-4 transition hover:bg-white/25">
              <History size={22} />
              <span className="text-sm font-medium">History</span>
            </button>
          </div>
        </div>

        {/* Fund Wallet Section */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Plus className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Fund Wallet
              </h2>
              <p className="text-sm text-gray-500">
                Add money to your AbuPay wallet
              </p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
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
                ₦{value.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-medium text-gray-500">
                  ₦
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border py-3.5 pr-4 pl-9 text-lg outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Minimum amount: ₦100
              </p>
            </div>

            <button
              onClick={handleFund}
              disabled={funding || !amount}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {funding ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                "Fund Wallet"
              )}
            </button>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
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

        {/* Note */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Wallet funding is currently in test mode.
            Real payment gateway (Paystack / Flutterwave) will be connected
            soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}